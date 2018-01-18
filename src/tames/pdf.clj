(ns tames.pdf
  ;(:require [clojure.java.jdbc :as jdbc])
  (:import (java.io File FileOutputStream IOException)
           (java.util ArrayList)
           (com.itextpdf.text Rectangle Document Paragraph PageSize)
           (com.itextpdf.text.pdf PdfWriter BaseFont PdfContentByte)
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

(defn create
  "Create a PDF file"
  [data]
  (let [tmp-pdf-file (File/createTempFile "atena" ".pdf")
        document     (Document. (. PageSize A4) 0 0 0 0)
        page-size    (. document getPageSize)
        writer       (PdfWriter/getInstance document (FileOutputStream. tmp-pdf-file))
        hmv          (BaseFont/createFont "HeiseiMin-W3" "UniJIS-UCS2-V" BaseFont/EMBEDDED)
        hmh          (BaseFont/createFont "HeiseiMin-W3" "UniJIS-UCS2-H" BaseFont/EMBEDDED)]
    (. document open)
    (let [context-byte (.. writer getDirectContent)
          graphics-2d  (PdfGraphics2D. context-byte (. page-size getWidth) (. page-size getHeight))
          print-fns    {"text" #(print-text! context-byte hmh %1)
                        "line" #(print-line! graphics-2d %1)}]
      (doseq [pdf-object (data "pdf_objects")]
        (let [print-fn (print-fns (pdf-object "type"))]
          (print-fn pdf-object)))
      (. graphics-2d dispose))
    (. document close)
    (. writer close)
    (println (. tmp-pdf-file getAbsolutePath))))
