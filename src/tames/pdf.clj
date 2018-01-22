(ns tames.pdf
  ;(:require [clojure.java.jdbc :as jdbc])
  (:import (java.io File FileOutputStream IOException)
           (java.util ArrayList)
           (java.awt Color)
           (com.itextpdf.text Rectangle Document Paragraph PageSize Phrase Font FontFactory Element)
           (com.itextpdf.text.pdf PdfWriter BaseFont PdfContentByte PdfPTable)
           (com.itextpdf.awt PdfGraphics2D)))

(defn print-text!
  [context-byte font pdf-object]
  (.. context-byte beginText)
  (doto context-byte
    (.setFontAndSize font (pdf-object "font_size"))
    (.setTextMatrix (pdf-object "x") (pdf-object "y"))
    (.showText (pdf-object "text")))
  (.. context-byte endText))

(defn print-line!
  [graphics-2d pdf-object]
  (. graphics-2d drawLine (pdf-object "x1") (pdf-object "y1") (pdf-object "x2") (pdf-object "y2")))

(defn print-phrase!
  [document font pdf-object]
  (println (pdf-object "text"))
  (let [phrase (Phrase. (pdf-object "text") (Font. font (float 20.0)))]
    (. document add phrase)))

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

(defn create
  "Create a PDF file"
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
          print-fns    {"text"   #(print-text! context-byte hkgh %1)
                        "phrase" #(print-phrase! document hkgh %1)
                        "line"   #(print-line! graphics-2d %1)}]
      (doseq [pdf-object (data "pdf_objects")]
        (let [print-fn (print-fns (pdf-object "type"))]
          (print-fn pdf-object)))
      (. graphics-2d dispose))
    (. document close)
    (. writer close)))

