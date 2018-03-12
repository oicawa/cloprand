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

(defn to-path
  [target]
  (let [target-type (type target)]
    (cond (= target-type String) (. (File. target) toPath)
          (= target-type File) (. target toPath)
          (= target-type Path) target
          :else nil)))

(defn to-file
  [target]
  (let [target-type (type target)]
    (cond (= target-type String) (File. target)
          (= target-type Path) (. target toFile)
          (= target-type File) target
          :else nil)))

(defn get-absolute-path
  [target]
  (let [file (to-file target)]
    (if (not (. file exists))
        (. file getCanonicalPath)
        (let [path      (. file toPath)
              options   (into-array LinkOption [LinkOption/NOFOLLOW_LINKS])
              real-path (. path toRealPath options)]
          (. real-path toString)))))

(defn make-path
  [base & more]
  (loop [path        (to-path base)
         descendants more]
    (if (empty? descendants)
        (. path toString)
        (recur (. path resolve (first descendants))
               (rest descendants)))))
  
(defn ext
  [target]
  (let [name  (. (to-file target) getName)
        start (. name lastIndexOf ".")]
    (if (= start -1)
        ""
        (. name substring (+ start 1)))))

(defn file-name-without-ext
  [target]
  (let [name (. (to-file target) getName)
        end  (. name lastIndexOf ".")]
    (if (= end -1)
        ""
        (. name substring 0 end))))

(defn delete
  [target]
  (let [file (to-file target)]
    (if (. file isDirectory)
        (doseq [child (. file listFiles)]
          (delete child)))
    (. file delete)))

(defn copy
  [src dst]
  (let [src-path (to-path src)
        dst-path (to-path dst)
        options (into-array CopyOption [StandardCopyOption/COPY_ATTRIBUTES])]
    (Files/copy src-path dst-path options)))
