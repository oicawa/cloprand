(ns tames.generators.pdf
  (:require [tames.operations.fonts :as fonts]
            [clojure.pprint :as pprint]
            [clojure.string :as string]
            [tames.log :as log])
  (:import (java.io File FileOutputStream IOException)
           (java.util ArrayList)
           (java.awt Color)
           (com.itextpdf.text Rectangle Document Paragraph PageSize Phrase Paragraph Font FontFactory Element)
           (com.itextpdf.text.pdf PdfWriter BaseFont PdfContentByte PdfPTable PdfPCell)
           (com.itextpdf.awt PdfGraphics2D)))

(defn get-content-type
  []
  "application/pdf")

(def directions { "h" BaseFont/IDENTITY_H
                  "v" BaseFont/IDENTITY_V })

(def default-fonts (ref {:hmv  (BaseFont/createFont "HeiseiMin-W3" "UniJIS-UCS2-V" BaseFont/EMBEDDED)
                         :hmh  (BaseFont/createFont "HeiseiMin-W3" "UniJIS-UCS2-H" BaseFont/EMBEDDED)
                         :hkgv (BaseFont/createFont "HeiseiKakuGo-W5" "UniJIS-UCS2-V" BaseFont/EMBEDDED)
                         :hkgh (BaseFont/createFont "HeiseiKakuGo-W5" "UniJIS-UCS2-H" BaseFont/EMBEDDED)}))

(defn add-element
  [parent element]
  (if (= (type parent) PdfPCell)
      (. parent addElement element)
      (. parent add element)))

(declare add-fns)

(defn add-object
  [parent pdf-object]
  (let [output-type (pdf-object "output_type")
        add-fn      (add-fns output-type)]
    ;(if (= "Paragraph" output-type)
    ;    (pprint/pprint pdf-object))
    (if (nil? add-fn)
        (println (format "[SKIPPED] output_type=[%s] is not supported..." output-type))
        (add-fn parent pdf-object))))

(defn add-objects
  [parent pdf-objects]
  (doseq [pdf-object pdf-objects]
    (add-object parent pdf-object)))

(defn draw-text-horizontal!
  [context-byte x y text]
  (doto context-byte
      (.setTextMatrix x y)
      (.showText text)))

(def rotations "()（）[]「」『』【】〔〕［］{}｛｝<>＜＞≪≫〈〉《》")
(def flip-rot "-ー=＝|｜")
(def right-top-1 "。、．，")
(def right-top-2 "ぁぃぅぇぉっゃゅょァィゥェォッャュョ")
(def specific "様")
(defn draw-text-vertical!
  [context-byte x y text font font-size]
  (loop [chars    (seq text)
         y-cursor y]
    (if (= (count chars) 0)
        nil
        (let [c     (first chars)
              width (. font getWidthPoint (int c) (float font-size))
              move1 (/ width 2)
              move2 (/ width 8)]
          ;;; PdfContentByte.setTextMatrix's arguments from 1st to 4th are Matrix element.
          ;;; You can draw characters as you like by doing mathematical matrix operations. (Rotation, inversion, diagonal, etc.)
          (cond (<= 0 (. rotations   indexOf (int c))) (. context-byte setTextMatrix 0 -1 1 0 (+ x move1) (- y-cursor move1))
                (<= 0 (. right-top-1 indexOf (int c))) (. context-byte setTextMatrix (+ x move1) (+ y-cursor move1))
                (<= 0 (. right-top-2 indexOf (int c))) (. context-byte setTextMatrix (+ x move2) (+ y-cursor move2))
                (<= 0 (. flip-rot    indexOf (int c))) (. context-byte setTextMatrix 0 -1 -1 0 (- x move1) (- y-cursor move1))
                :else                                  (. context-byte setTextMatrix x y-cursor))
          (. context-byte showText (format "%c" c))
          (recur (rest chars) (- y-cursor width))))))

(defn draw-text!
  [parent pdf-object]
  (let [context-byte (parent :context-byte)
        direction    (pdf-object "direction")
        identify     (directions direction)
        font         (let [font-path (fonts/get-font-file-path (pdf-object "font"))]
                       (if (or (nil? font-path) (= font-path ""))
                           (parent :font)
                           (BaseFont/createFont font-path identify BaseFont/EMBEDDED)))
        font-size    (let [tmp-font-size (pdf-object "font_size")]
                       (float (if (nil? tmp-font-size) (parent :font-size) tmp-font-size)))
        x            (pdf-object "x")
        y            (pdf-object "y")
        text         (pdf-object "text")]
    (. context-byte beginText)
    (. context-byte setFontAndSize font font-size)
    (cond (= direction "h") (draw-text-horizontal! context-byte x y text)
          (= direction "v") (draw-text-vertical! context-byte x y text font font-size))
    (.. context-byte endText)))

(defn draw-line!
  [parent pdf-object]
  (let [document     (parent :object)
        context-byte (parent :context-byte)
        graphics-2d  (PdfGraphics2D. context-byte (. document getWidth) (. document getHeight))]
    (. graphics-2d drawLine (pdf-object "x1") (pdf-object "y1") (pdf-object "x2") (pdf-object "y2"))
    (. graphics-2d dispose)))

(defn add-phrase!
  [parent pdf-object]
  (let [parent-object (parent :object)
        base-font     (let [font-path (fonts/get-font-file-path (pdf-object "font"))]
                        (if (or (nil? font-path) (= font-path ""))
                            (parent :font)
                            (BaseFont/createFont font-path BaseFont/IDENTITY_H BaseFont/EMBEDDED)))
        font-size     (let [tmp-font-size    (pdf-object "font_size")
                            parent-font-size (parent :font-size)]
                        (float (if (nil? tmp-font-size) parent-font-size tmp-font-size)))
        font          (Font. base-font font-size)
        text          (pdf-object "text")]
    (let [phrase (Phrase. text font)]
      (add-element parent-object phrase))))

(defn add-paragraph!
  [parent pdf-object]
  ;(pprint/pprint pdf-object)
  (let [parent-object (parent :object)
        font          (let [font-path (fonts/get-font-file-path (pdf-object "font"))]
                        (if (or (nil? font-path) (= font-path ""))
                            (parent :font)
                            (BaseFont/createFont font-path BaseFont/IDENTITY_H BaseFont/EMBEDDED)))
        font-size     (let [tmp-font-size    (pdf-object "font_size")
                            parent-font-size (parent :font-size)]
                        (float (if (nil? tmp-font-size) parent-font-size tmp-font-size)))]
  (let [paragraph (Paragraph. (pdf-object "text") (Font. font font-size))]
    (add-element parent-object paragraph))))

(defn add-table!
  [parent pdf-object]
  (println ">>> in add-table!")
  (pprint/pprint pdf-object)
  (let [parent-object (parent :object)
        column-widths (map #(Float/parseFloat %1) (string/split (pdf-object "columns") #","))
        table         (PdfPTable. (count column-widths))
        ]
    (pprint/pprint column-widths)
    (pprint/pprint (float-array column-widths))
    (doto table
      ;(.setWidth widths)
      (.setWidths (float-array column-widths))
      (.setHorizontalAlignment Element/ALIGN_CENTER)
      ;(.setVerticalAlignment Element/ALIGN_MIDDLE)
      ;(.setPadding 3)
      ;(.setSpacing 0)
      ;(.setBorderColor (Color/BLACK))
      )
    (doseq [cell-object (pdf-object "cells")]
      (let [cell    (PdfPCell. )
            parent2 (assoc parent :object cell)]
        (doto cell
          (.setHorizontalAlignment Element/ALIGN_CENTER)
          (.setVerticalAlignment Element/ALIGN_MIDDLE))
        (add-object parent2 cell-object)
        (. table addCell cell)))
    (add-element parent-object table)))

(defn draw-custom-layout!
  [parent pdf-object]
  (println "Called draw-custom-layout!"))

(defn insert-new-page!
  [parent pdf-object]
  (let [document (parent :object)
        cb       (parent :context-byte)]
    (. document newPage)))

(def add-fns {"TextDraw"   draw-text!
              "Phrase"     add-phrase!
              "Paragraph"  add-paragraph!
              "Line"       draw-line!
              "Table"      add-table!
              "Custom"     draw-custom-layout!
              "NewPage"    insert-new-page!})

(defn print-font-families
  []
  (println "----------")
  (let [families (FontFactory/getRegisteredFamilies)]
    (doseq [family families]
      (println family))))
  
(defn print-base-font-names
  [base-font]
  (println "----------")
  (let [name-table (. base-font getFullFontName)]
    (doseq [name-row name-table]
      (doseq [name-col name-row]
        (println name-col)))))

(defn generate
  "Generate a PDF file"
  [file data]
  (let [page         (if (nil? (data "page"))
                         { "size" { "width" 210 "height" 297 }}
                         (data "page"))
        page-rect    (let [size (page "size")]
                       (if (nil? size)
                           (. PageSize A4)
                           (Rectangle. (* 2.83 (size "width")) (* 2.83 (size "height")))))
        page-margins (let [margins (page "margins")]
                       (if (nil? margins)
                           { "left" 20 "right" 20 "top" 20 "bottom" 20 }
                           margins))
        document  (Document. page-rect (page-margins "left") (page-margins "right") (page-margins "top") (page-margins "bottom"))
        writer    (PdfWriter/getInstance document (FileOutputStream. file))
        ]
    (. document open)
    (let [context-byte (.. writer getDirectContent)
          parent       {:object       document
                        :context-byte context-byte
                        :font         (@default-fonts :hkgh)
                        :font-size    (float 10.0)}]
      (add-objects parent (data "pdf_objects")))
    (. document close)
    (. writer close)))

