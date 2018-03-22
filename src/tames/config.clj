(ns tames.config
  (:gen-class)
  (:require [clojure.pprint :as pprint]
            [clojure.java.io :as io]
            [clojure.data.json :as json]
            [clojure.string :as string]
            [tames.debug :as debug]
            [tames.filesystem :as fs]
            [tames.log :as log])
  (:import (java.io File InputStream)
           (java.nio.file Paths Path Files StandardCopyOption CopyOption)
           (java.util.jar JarFile JarEntry)
           (java.util UUID Calendar)))

(def data (ref nil))
(def path (atom nil))

(def CLASS_ID "15ab1b06-3756-48df-b045-728499aa9a6c")
(def DEFAULT_ID "e71de065-9b6a-42c7-9987-ddc8e75672ca")

(defn site-name
  []
  (@data "site_name"))

(defn id?
  [class-id]
  (= class-id CLASS_ID))

(defn last-modified
  []
  (. (File. @path) lastModified))

(defn base-name
  []
  (fs/file-name-without-ext (. (File. @path) getName)))
  
(defn get-attachment-dir
  [& field_name]
  (let [file       (File. @path)
        base-dir   (. file getParentFile)
        dir-name   (format ".%s" (fs/file-name-without-ext (. file getName)))
        target-dir (fs/to-file (apply fs/make-path (concat [base-dir dir-name] field_name)))]
    target-dir))

(defn get-attachment-file
  [field_and_file_name]
  (let [dir  (get-attachment-dir)
        path (fs/make-path dir field_and_file_name)]
    (fs/to-file path)))

(defn image-path
  [field-name default-path]
  (let [dir    (get-attachment-dir field-name)
        files  (vec (. dir listFiles))]
    (if (empty? files)
        default-path
        (format ".%s/%s/%s" (base-name) field-name (. (files 0) getName)))))
  
(defn favicon-path
  []
  (image-path "favicon" "core/favicon.ico"))

(defn logo-path
  []
  (image-path "logo" "core/logo.svg"))

(defn package-paths
  []
  (map #(fs/get-absolute-path (%1 "path"))
       (@data "packages")))

(defn attachment-dir
  [config-path]
  (let [config-file    (fs/to-file config-path)
        parent-dir     (fs/to-path (. config-file getParentFile))
        base-name      (fs/file-name-without-ext config-file)
        attachment-dir (. parent-dir resolve (format ".%s" base-name))]
    (. attachment-dir toFile)))
        
(defn ensure-config-file
  [path]
  (let [src-file (File. (format "data/%s/%s.json" CLASS_ID DEFAULT_ID))
        dst-file (File. (if (empty? path) "./config.json" path))
        dst-dir  (. src-file getParentFile)]
    (cond (not (. dst-dir exists))
            (do (log/fatal "Target directory does not exist. [%s]" (fs/get-absolute-path dst-dir)) nil)
          (and (. dst-file exists) (. dst-file isDirectory))
            (do (log/fatal "Target file is directory. [%s]" (fs/get-absolute-path dst-file)) nil)
          :else
            (do
              (when (not (. dst-file exists))
                    (fs/copy src-file dst-file)
                    (fs/copy (attachment-dir src-file) (attachment-dir dst-file))
                    (log/info "Default config file is copied."))
              (log/info "Config file [%s]" (fs/get-absolute-path dst-file))
              dst-file))))

(defn update
  []
  (let [p   @path
        tmp (with-open [rdr (io/reader p)]
              #?=(json/read rdr))]
    (dosync (ref-set data tmp))))

(defn init
  [config-path]
  (let [file   (ensure-config-file config-path)
        result (not (nil? file))]
    (when result
      (reset! path (. file getAbsolutePath))
      ;(dosync (ref-set data (with-open [rdr (io/reader (. file getAbsolutePath))]
      ;                        (json/read rdr))))
      (update))
    result))
