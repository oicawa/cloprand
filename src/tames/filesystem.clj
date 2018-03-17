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
        (recur (. path resolve (. (first descendants) toString))
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

(defn get-children
  [dir-path dir? file?]
  (let [file     (to-file dir-path)
        children (filter #(cond (and dir? file?) true
                                (and dir? (not file?)) (. %1 isDirectory)
                                (and (not dir?) file?) (not (. %1 isDirectory))
                                :else                  false)
                         (. file listFiles))]
    (map #(. %1 getName) children)))

(defn get-all-files
  ([list-files filter-fn results]
   (let [files (filter #(and (. %1 isFile) (filter-fn %1)) list-files)]
     (loop [dirs     (filter #(. %1 isDirectory) list-files)
            _results (concat files results)]
       (if (empty? dirs)
           _results
           (recur (rest dirs)
                  (get-all-files (vec (. (first dirs) listFiles))
                                 filter-fn
                                 _results))))))
  ([path filter-fn]
   (let [file (to-file path)]
     (cond (. file isDirectory) (get-all-files (vec (. file listFiles)) filter-fn [])
           (filter-fn file)     [file]
           :else                []))))

(defn ensure-directory
  [target]
  (let [dir (to-file target)]
    (if (and (. dir exists) (not (. dir isDirectory)))
        (. dir delete))
    (if (not (. dir exists))
        (. dir mkdirs))))







