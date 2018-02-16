(ns tames.generators.pdf
  (:require [tames.operations.fonts :as fonts]
            [clojure.pprint :as pprint]
            [clojure.string :as string])
  (:import (java.io File FileOutputStream IOException)
           (java.util ArrayList)
           (java.awt Color)
           (com.itextpdf.text Rectangle Document Paragraph PageSize Phrase Paragraph Font FontFactory Element)
           (com.itextpdf.text.pdf PdfWriter BaseFont PdfContentByte PdfPTable PdfPCell)
           (com.itextpdf.awt PdfGraphics2D)))

(defn get-content-type
  []
  "application/pdf")

(def directions { "horizontal" BaseFont/IDENTITY_H
                  "vertical"   BaseFont/IDENTITY_V })

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

(defn draw-text!
  [parent pdf-object]
  ;(pprint/pprint pdf-object)
  (let [context-byte (parent :context-byte)
        direction    (directions (pdf-object "direction"))
        font         (let [font-path (fonts/get-font-file-path (pdf-object "font"))]
                       (if (or (nil? font-path) (= font-path ""))
                           (parent :font)
                           (BaseFont/createFont font-path direction BaseFont/EMBEDDED)))
        font-size    (let [tmp-font-size (pdf-object "font_size")]
                       (float (if (nil? tmp-font-size) (parent :font-size) tmp-font-size)))
        ]
    (.. context-byte beginText)
    (doto context-byte
      (.setFontAndSize font font-size)
      (.setTextMatrix (pdf-object "x") (pdf-object "y"))
      (.showText (pdf-object "text")))
    (.. context-byte endText)))

(defn draw-line!
  [parent pdf-object]
  (let [graphics-2d (parent :graphics-2d)]
    (. graphics-2d drawLine (pdf-object "x1") (pdf-object "y1") (pdf-object "x2") (pdf-object "y2"))))

(defn add-phrase!
  [parent pdf-object]
  ;(pprint/pprint pdf-object)
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
  (let [paragraph (Paragraph. #?=(pdf-object "text") #?=(Font. font font-size))]
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

(def add-fns {"TextDraw"   draw-text!
              "Phrase"     add-phrase!
              "Paragraph"  add-paragraph!
              "Line"       draw-line!
              "Table"      add-table!})

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
  (let [document     (Document. (. PageSize A4) 20 20 20 20)
        page-size    (. document getPageSize)
        writer       (PdfWriter/getInstance document (FileOutputStream. file))
        ]
    (. document open)
    (let [context-byte (.. writer getDirectContent)
          graphics-2d  (PdfGraphics2D. context-byte (. page-size getWidth) (. page-size getHeight))
          parent       {:object       document
                        :context-byte context-byte
                        :graphics-2d  graphics-2d
                        :font         (@default-fonts :hkgh)
                        :font-size    (float 10.0)}]
      (add-objects parent (data "pdf_objects"))
      (. graphics-2d dispose))
    (. document close)
    (. writer close)))

