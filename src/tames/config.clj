(ns tames.config
  (:gen-class)
  (:use [tames.debug])
  (:require [clojure.pprint :as pprint]
            [clojure.java.io :as io]
            [clojure.data.json :as json]
            [clojure.string :as string]
            [tames.filesystem :as fs]
            [tames.log :as log])
  (:import (java.io File InputStream)
           (java.nio.file Paths Path Files StandardCopyOption CopyOption)
           (java.util.jar JarFile JarEntry)
           (java.util UUID Calendar)))

(def data (ref nil))
(def relative-config-path (atom nil))

(def CLASS_ID "15ab1b06-3756-48df-b045-728499aa9a6c")
(def DEFAULT_ID "e71de065-9b6a-42c7-9987-ddc8e75672ca")

(defn path
  []
  @relative-config-path)

(defn site-name
  []
  (@data "site_name"))

(defn id?
  [class-id]
  (= class-id CLASS_ID))

(defn last-modified
  []
  (. (File. @relative-config-path) lastModified))

(defn base-name
  []
  (fs/file-name-without-ext (. (File. @relative-config-path) getName)))
  
(defn base-attachment-dir
  [config-path]
  (let [config-file (fs/to-file config-path)
        parent-dir  (fs/to-path (. config-file getParentFile))
        base-name   (fs/file-name-without-ext config-file)
        base-path   (. parent-dir resolve (format ".%s" base-name))]
    (. base-path toFile)))
        
(defn get-attachment-dir
  [& field_name]
  (let [file       (File. @relative-config-path)
        base-dir   (. file getParentFile)
        dir-name   (format ".%s" (fs/file-name-without-ext (. file getName)))
        target-dir (fs/to-file (apply fs/make-path (concat [base-dir dir-name] field_name)))]
    target-dir))

(defn get-attachment-file
  [field_and_file_name]
  (let [dir  (get-attachment-dir)
        path (fs/make-path dir field_and_file_name)]
    (fs/to-file path)))

(defn url-path
  [field-name default-path]
  (let [dir    (get-attachment-dir field-name)
        files  (vec (. dir listFiles))]
    (if (empty? files)
        default-path
        (format "%s/%s/%s" (site-name) field-name (. (files 0) getName)))))
  
(defn favicon-path
  []
  (url-path "favicon" "core/favicon.ico"))

(defn logo-path
  []
  (url-path "logo" "core/logo.svg"))

(defn resource-file
  [relative-url-path]
  (let [start         (+ (. (site-name) length) 1)
        relative-path (. relative-url-path substring start)
        base-path     (. (base-attachment-dir @relative-config-path) toPath)
        target-path   (. base-path resolve relative-path)]
    (. target-path toFile)))

(defn package-paths
  []
  (map #(fs/get-absolute-path (%1 "path"))
       (@data "packages")))

(defn ensure-config-file
  [path]
  (log/info  "Running directory path [%s]" (System/getProperty "user.dir"))
  (let [default-path (format "data/%s/%s.json" CLASS_ID DEFAULT_ID)
        target-file  (File. (if (empty? path) default-path path))
        target-dir   (. target-file getParentFile)]
    (cond (not (. target-dir exists))
            (do (log/fatal "Target directory does not exist. [%s]" target-dir) nil)
          (and (. target-file exists) (. target-file isDirectory))
            (do (log/fatal "Target file is directory. [%s]" target-file) nil)
          :else
            (do
              (when (not (. target-file exists))
                    (fs/copy (File. default-path) target-file)
                    (fs/copy (base-attachment-dir default-path) (base-attachment-dir target-file))
                    (log/info "Default config file is copied."))
              (log/info "Config file relative path [%s]" target-file)
              target-file))))

(defn update
  []
  (let [tmp (with-open [rdr (io/reader @relative-config-path)]
              (json/read rdr))]
    (dosync (ref-set data tmp))
    @data))

(defn init
  [config-path]
  (let [file   (ensure-config-file config-path)
        result (not (nil? file))]
    (when result
      (reset! relative-config-path (. file getPath))
      ;(dosync (ref-set data (with-open [rdr (io/reader (. file getAbsolutePath))]
      ;                        (json/read rdr))))
      (update))
    result))
