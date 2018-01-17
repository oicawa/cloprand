(ns tames.pdf
  ;(:require [clojure.java.jdbc :as jdbc])
  (:import (java.io File FileOutputStream IOException)
           (java.util ArrayList)
           (com.itextpdf.text Rectangle Document Paragraph PageSize)
           (com.itextpdf.text.pdf PdfWriter BaseFont PdfContentByte)))

(defn print-text!
  [dc font pdf-object]
  (doto dc
    (.setFontAndSize font (pdf-object "font_size"))
    (.setTextMatrix (pdf-object "x") (pdf-object "y"))
    (.showText (pdf-object "text"))))

(defn create
  "Create a PDF file"
  [data]
  (let [tmp-pdf-file (File/createTempFile "atena" ".pdf")
        document     (Document. (. PageSize A4) 0 0 0 0)
        writer       (PdfWriter/getInstance document (FileOutputStream. tmp-pdf-file))
        hmv          (BaseFont/createFont "HeiseiMin-W3" "UniJIS-UCS2-V" BaseFont/EMBEDDED)
        hmh          (BaseFont/createFont "HeiseiMin-W3" "UniJIS-UCS2-H" BaseFont/EMBEDDED)]
    (.. document open)
    (let [dc (.. writer getDirectContent)]
      (.. dc beginText)
      (doseq [pdf-object (data "pdf_objects")] ;item = [ {:fsize fsize :top top :left left :value value} ... ]
        (print-text! dc hmh pdf-object))
      (.. dc endText))
    (.. document close)
    (println (. tmp-pdf-file getAbsolutePath))))
