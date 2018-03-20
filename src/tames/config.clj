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

(defn package-paths
  []
  (map #(fs/get-absolute-path (%1 "path"))
       (@data "packages")))

(defn ensure-config-file
  [path]
  (let [default-path (format "data/%s/%s.json" CLASS_ID DEFAULT_ID)
        file         (File. (fs/get-absolute-path (if (empty? path) default-path path)))
        dir          (. file getParentFile)]
    (cond (not (. dir exists))
            (do (log/fatal "Target directory does not exist. [%s]" (. dir getAbsolutePath)) nil)
          (and (. file exists) (. file isDirectory))
            (do (log/fatal "Target file is directory. [%s]" (. file getAbsolutePath)) nil)
          :else
            (do
              (when (not (. file exists))
                    (fs/copy default-path file)
                    (log/info "Default config file is copied."))
              (log/info "Config file [%s]" (. file getAbsolutePath))
              file))))

(defn init
  [config-path]
  (let [file   (ensure-config-file config-path)
        result (not (nil? file))]
    (when result
      (reset! path (. file getAbsolutePath))
      (dosync (ref-set data (with-open [rdr (io/reader (. file getAbsolutePath))]
                              (json/read rdr)))))
    result))
