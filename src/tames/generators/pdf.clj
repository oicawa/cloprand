(ns tames.generators.pdf
  (:require [tames.operations.fonts :as fonts]
            [clojure.pprint :as pprint])
  (:import (java.io File FileOutputStream IOException)
           (java.util ArrayList)
           (java.awt Color)
           (com.itextpdf.text Rectangle Document Paragraph PageSize Phrase Paragraph Font FontFactory Element)
           (com.itextpdf.text.pdf PdfWriter BaseFont PdfContentByte PdfPTable)
           (com.itextpdf.awt PdfGraphics2D)))

(defn get-content-type
  []
  "application/pdf")

(def directions { "horizontal" BaseFont/IDENTITY_H
                   "vertical"  BaseFont/IDENTITY_V })

(defn print-text!
  [context-byte default-font pdf-object]
  (pprint/pprint pdf-object)
  (let [font-name (pdf-object "font")
        font-path (fonts/get-font-file-path font-name)
        direction (directions (pdf-object "direction"))
        this-font (if (or (nil? font-path) (= font-path ""))
                      nil
                      (BaseFont/createFont font-path direction BaseFont/EMBEDDED))
        font      (if (nil? this-font) default-font this-font)]
    (.. context-byte beginText)
    (doto context-byte
      (.setFontAndSize font (pdf-object "font_size"))
      (.setTextMatrix (pdf-object "x") (pdf-object "y"))
      (.showText (pdf-object "text")))
    (.. context-byte endText)))

(defn print-line!
  [graphics-2d pdf-object]
  (. graphics-2d drawLine (pdf-object "x1") (pdf-object "y1") (pdf-object "x2") (pdf-object "y2")))

(defn print-phrase!
  [document default-font pdf-object]
  (pprint/pprint pdf-object)
  (let [font-name (pdf-object "font")
        font-path (fonts/get-font-file-path font-name)
        this-font (if (or (nil? font-path) (= font-path ""))
                      nil
                      (BaseFont/createFont font-path BaseFont/IDENTITY_H BaseFont/EMBEDDED))
        font      (if (nil? this-font) default-font this-font)]
  (let [phrase (Phrase. (pdf-object "text") (Font. font (float 20.0)))]
    (. document add phrase))))

(defn print-paragraph!
  [document default-font pdf-object]
  (pprint/pprint pdf-object)
  (let [font-name (pdf-object "font")
        font-size (pdf-object "font_size")
        font-path (fonts/get-font-file-path font-name)
        this-font (if (or (nil? font-path) (= font-path ""))
                      nil
                      (BaseFont/createFont font-path BaseFont/IDENTITY_H BaseFont/EMBEDDED))
        font      (if (nil? this-font) default-font this-font)]
  (let [paragraph (Paragraph. (pdf-object "text") (Font. font (float font-size)))]
    (. document add paragraph))))

(defn print-table!
  [document font pdf-object]
  (let [column-widths (pdf-object "column_widths")
        table         (PdfPTable. (count column-widths))]
    (doto table
      (.setWidth (pdf-object "width"))
      (.setWidths (into-array column-widths))
      (.setDefaultHorizontalAlignment Element/ALIGN_CENTER)
      (.setDefaultVerticalAlignment Element/ALIGN_MIDDLE)
      (.setPadding 3)
      (.setSpacing 0)
      (.setBorderColor (Color/BLACK)))
    (doseq [cell (pdf-object "cells")]
      (. table add cell))
    (. document add table)))

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
        hmv          (BaseFont/createFont "HeiseiMin-W3" "UniJIS-UCS2-V" BaseFont/EMBEDDED)
        hmh          (BaseFont/createFont "HeiseiMin-W3" "UniJIS-UCS2-H" BaseFont/EMBEDDED)
        hkgv         (BaseFont/createFont "HeiseiKakuGo-W5" "UniJIS-UCS2-V" BaseFont/EMBEDDED)
        hkgh         (BaseFont/createFont "HeiseiKakuGo-W5" "UniJIS-UCS2-H" BaseFont/EMBEDDED)
        ]
    (. document open)
    (let [context-byte (.. writer getDirectContent)
          graphics-2d  (PdfGraphics2D. context-byte (. page-size getWidth) (. page-size getHeight))
          print-fns    {"TextDraw"   #(print-text! context-byte hkgh %1)
                        "Phrase"     #(print-phrase! document hkgh %1)
                        "Paragraph"  #(print-paragraph! document hkgh %1)
                        "Line"   #(print-line! graphics-2d %1)
                        }]
      (doseq [pdf-object (data "pdf_objects")]
        (let [print-fn  (print-fns (pdf-object "output_type"))]
          (print-fn pdf-object)))
      (. graphics-2d dispose))
    (. document close)
    (. writer close)))

