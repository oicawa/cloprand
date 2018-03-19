(ns tames.operations.resource
  (:require [clojure.pprint :as pprint]
            [clojure.data.json :as json]
            [clojure.java.io :as io]
            [clojure.string :as string]
            [ring.util.response :as response]
            [tames.systems :as systems]
            [tames.filesystem :as fs]
            [tames.log :as log])
  (:import (java.io File)
           (java.net URLDecoder URLEncoder)
           (java.util.jar JarFile JarEntry)
           (java.text SimpleDateFormat)))

(defn time-to-ISO8601
  [time]
  (let [f   "yyyy-MM-dd'T'HH:mm:ss"
        sdf (SimpleDateFormat. f)]
    (. sdf format time)))

;;; ------------------------------------------------------------
;;; Jar & Resources
;;; ------------------------------------------------------------
;(defn get-resource-path
;  [relative-path]
;  (. (File. relative-path) getPath))

(defn get-jar-path
  [resource]
  (assert (not (nil? resource)))
  (assert (= "jar" (. resource getProtocol)))
  (let [path     (. resource getPath)
        start    (. "file:" length)
        end      (. path indexOf "!")
        jar-path (. path substring start end)]
    jar-path))

(defn extract-resource-path
  [resource-url]
  (assert (not (nil? resource-url)))
  (assert (= "jar" (. resource-url getProtocol)))
  (let [path          (. resource-url getPath)
        start         (+ (. path indexOf "!") 2)
        resource-path (. path substring start)]
    resource-path))

(defn get-jar-resource-entry
  [jar-url]
  (let [jar-path   (get-jar-path jar-url)
        jar-file   (JarFile. (File. jar-path))
        path       (extract-resource-path jar-url)
        jar-entry  (. jar-file getJarEntry path)]
    jar-entry))

(defn get-jar-resource-children
  [jar-path relative-path dir? file?]
  (let [jar-file   (JarFile. (File. jar-path))
        entries    (. jar-file entries)
        base-path  (. (File. relative-path) toPath)
        base-count (. base-path getNameCount)]
    (loop [paths '()]
      (if (. entries hasMoreElements)
          (let [entry          (. entries nextElement)
                path           (. entry getName)
                entry-path     (. (File. path) toPath)
                entry-path-cnt (. entry-path getNameCount)
                entry-dir?     (. entry isDirectory)]
            (recur (if (and (. entry-path startsWith base-path)
                            (= (+ base-count 1) entry-path-cnt)
                            (or (and dir? entry-dir?) (and file? (not entry-dir?))))
                       (cons (. (File. path) getName) paths)
                       paths)))
          (do
            (. jar-file close)
            (vec paths))))))

;(defn get-absolute-children
;  [relative-dir-path dir? file?]
;  (let [absolute-dir (File. (fs/get-absolute-path relative-dir-path))
;        children     (filter #(cond (and dir? file?) true
;                                    (and dir? (not file?)) (. %1 isDirectory)
;                                    (and (not dir?) file?) (not (. %1 isDirectory))
;                                    :else                  false)
;                             (. absolute-dir listFiles))]
;    (map #(. %1 getName) children)))


(defn get-resource-type
  [resource-url]
  (let [protocol (if (nil? resource-url) nil (. resource-url getProtocol))]
    (cond (= "file" protocol) :file
          (= "jar" protocol)  :jar
          :else               :none)))

(defn get-children
  [relative-dir-path dir? file?]
  (let [resource-url (io/resource relative-dir-path)
        type         (get-resource-type resource-url)]
    (cond (= :file type) (fs/get-children (. resource-url getPath) dir? file?)
          (= :jar type)  (let [jar-path (get-jar-path resource-url)]
                           (get-jar-resource-children jar-path relative-dir-path dir? file?))
          :else          nil)))

(defn copy-resource-file
  [resource-path dst-path]
  (let [src-url       (io/resource resource-path)
        type          (get-resource-type src-url)
        last-modified (cond (= :file type) (let [file (File. (. src-url toURI))]
                                             (. file lastModified))
                            (= :jar  type) (let [entry    (get-jar-resource-entry src-url)
                                                 filetime (. entry getLastModifiedTime)]
                                             (. filetime toMillis)))
        dst-file      (File. dst-path)
        ]
    (with-open [stream (io/input-stream src-url)]
      (io/copy stream dst-file))
    (. dst-file setLastModified last-modified)
    ))

(defn get-all-css-properties-list
  []
  (map #(let [file (systems/get-target-file %1)]
         {"path"          (. %1 getPath)
          "last-modified" (time-to-ISO8601 (. file lastModified))})
       (fs/get-all-files "core" (fn [file] (= (fs/ext file) "css")))))

(defn all-css-properties-list
  [data]
  (let [properties-list #?=(get-all-css-properties-list)]
    (-> (response/response (json/write-str properties-list))
        (response/header "Contents-Type" "text/json; charset=utf-8"))))

(defn get-properties-list
  [paths]
  (map #(let [file (systems/get-target-file %1)]
         {"path"          %1
          "last-modified" (time-to-ISO8601 (. file lastModified))})
       paths))

(defn properties-list
  [paths]
  (let [properties-list (get-properties-list paths)
        json            (json/write-str properties-list)
        encoded         (URLEncoder/encode json "UTF-8")]
    (-> (response/response json)
        (response/header "Contents-Type" "text/json; charset=utf-8"))))

(defn ensure-init-files
  [relative-path]
  (let [dirs  (get-children relative-path true false)
        files (get-children relative-path false true)]
    (if (or (nil? dirs) (nil? files))
        nil
        (do
          (fs/ensure-directory relative-path)
          (doseq [dir dirs]
            (ensure-init-files (str relative-path "/" dir)))
          (doseq [file files]
            (let [src-path (str relative-path "/" file)
                  dst-path (str relative-path "/" file)]
              (if (not (. (File. (fs/get-absolute-path dst-path)) exists))
                  (copy-resource-file src-path dst-path))
                  ))))))

(defn init
  []
  (ensure-init-files "lib")
  (ensure-init-files "core")
  (ensure-init-files "data")
  true)
