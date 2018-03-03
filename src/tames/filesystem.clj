(ns tames.filesystem
  (:gen-class)
  (:require [clojure.pprint :as pprint]
            [clojure.java.io :as io]
            [clojure.data.json :as json]
            [clojure.string :as string])
  (:import (java.io File InputStream)
           (java.nio.file Paths Path Files CopyOption StandardCopyOption LinkOption)
           (java.util.jar JarFile JarEntry)
           (java.util UUID Calendar)))

(defn get-absolute-path
  [relative-path]
  (let [file (File. relative-path)]
    (if (not (. file exists))
        (. file getCanonicalPath)
        (let [path      (. file toPath)
              options   (into-array LinkOption [LinkOption/NOFOLLOW_LINKS])
              real-path (. path toRealPath options)]
          (. real-path toString)))))

(defn to-path
  [value]
  (let [value-type (type value)]
    (cond (= value-type String) (. (File. value) toPath)
          (= value-type File) (. value toPath)
          (= value-type Path) value
          :else nil)))

(defn copy
  [src dst]
  (let [src-path (to-path src)
        dst-path (to-path dst)
        options (into-array CopyOption [StandardCopyOption/COPY_ATTRIBUTES])]
    (Files/copy src-path dst-path options)))
