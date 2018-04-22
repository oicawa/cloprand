(ns tames.fsutils
  (:gen-class)
  (:require [clojure.pprint :as pprint]
            [clojure.java.io :as io]
            [clojure.data.json :as json]
            [clojure.string :as string]
            [tames.log :as log])
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
     (loop [dirs    (filter #(. %1 isDirectory) list-files)
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
           :else                [])))
  ([path]
   (get-all-files path (fn [file] true))))

(defn ensure-directory
  [target]
  (let [dir (to-file target)]
    (if (and (. dir exists) (not (. dir isDirectory)))
        (. dir delete))
    (if (not (. dir exists))
        (. dir mkdirs))))

;;; ------------------------------
;;; File & Directory Copy
;;; ------------------------------
(defn copy-options
  [replace?]
  (let [options [StandardCopyOption/COPY_ATTRIBUTES
                 LinkOption/NOFOLLOW_LINKS]]
    (into-array CopyOption (if replace?
                               (conj options StandardCopyOption/REPLACE_EXISTING)
                               options))))

(declare copy)

(defn copy-dir
  [src dst replace?]
  (ensure-directory dst)
  (let [src-dir (to-file (get-absolute-path src))
        dst-dir (to-file (get-absolute-path dst))
        start   (.. src-dir (getAbsolutePath) (length))
        options (copy-options replace?)]
    (doseq [src-file (file-seq src-dir)]
      (let [src-path      (. src-file getAbsolutePath)
            relative-path (let [tmp (. src-path substring start)]
                            (if (= tmp "") tmp (. tmp substring 1)))
            dst-path      (.. dst-dir (toPath) (resolve relative-path))
            dst-file      (. dst-path toFile)]
        (cond (not (. dst-file exists))
                (Files/copy (. src-file toPath) (. dst-file toPath) options))
              (. src-file isDirectory)
                (ensure-directory dst-file)
              replace?
                (Files/copy (. src-file toPath) (. dst-file toPath) options)
                ))))
              
(defn copy
  ([src dst replace?]
   (let [src-file (to-file src)
         dst-file (to-file dst)]
     (cond (not (. src-file exists))
             (log/error "Source path does not exists. [%s]" (get-absolute-path src-file))
           (. src-file isDirectory)
             (copy-dir src-file dst-file replace?)
           (not (. dst-file exists))
             (Files/copy (to-path src) (to-path dst) (copy-options replace?))
           (. dst-file isDirectory)
             (log/error "Destination path is directory. [%s]" (get-absolute-path dst-file))
           replace?
             (Files/copy (to-path src) (to-path dst) (copy-options replace?))
           :else
             (log/error "Destination path exists. Skipped copy. [%s]" (get-absolute-path dst-file)))))
  ([src dst]
   (copy src dst true)))
