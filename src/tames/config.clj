(ns tames.config
  (:gen-class)
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

(def CLASS_ID "15ab1b06-3756-48df-b045-728499aa9a6c")
(def DEFAULT_ID "e71de065-9b6a-42c7-9987-ddc8e75672ca")

(defn ensure-config-file
  []
  (let [default-path (format "data/%s/%s.json" CLASS_ID DEFAULT_ID)
        file         (File. (fs/get-absolute-path (get (System/getenv) "CONFIG_PATH" default-path)))
        dir          (. file getParentFile)]
    (cond (not (. dir exists))
            (do
              (log/fatal "Target directory does not exist. [%s]" (. dir getAbsolutePath))
              nil)
          (and (. file exists) (. file isDirectory))
            (do
              (log/fatal "Target file is directory. [%s]" (. file getAbsolutePath))
              nil)
          :else
            (do
              (if (not (. file exists))
                  (do
                    (fs/copy default-path file)
                    (log/info "Default config file is copied.")))
              (log/info "Config file [%s]" (. file getAbsolutePath))
              file))))

(defn init
  []
  (let [config-file (ensure-config-file)]
    (if (nil? config-file)
        false
        true)))
