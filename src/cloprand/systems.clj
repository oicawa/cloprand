(ns cloprand.systems
  (:gen-class)
  (:use ring.adapter.jetty)
  (:require [clojure.java.io :as io]
            [ring.util.response :as response]
            [clojure.data.json :as json])
  (:import (java.io File InputStream)
           (java.util.jar JarFile JarEntry)))

(defn get-absolute-path
  [relative-path]
  (. (File. relative-path) getAbsolutePath))

(defn get-resource-path
  [relative-path]
  (. (File. relative-path) getPath))

(defn get-resource
  [relative-path]
  (if-let [resource (io/resource relative-path)]
    (if (= "file" (. resource getProtocol))
        (let [file (io/as-file resource)]
          (if (not (. file isDirectory))
              file))
        (io/input-stream resource))))

(defn get-jar-path
  [resource]
  (assert (not (nil? resource)))
  (assert (= "jar" (. resource getProtocol)))
  (let [path     (. resource getPath)
        start    (. "file:" length)
        end      (. path indexOf "!")
        jar-path (. path substring start end)]
    jar-path))

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

(defn get-absolute-children
  [relative-dir-path dir? file?]
  (let [absolute-dir (File. (get-absolute-path relative-dir-path))
        children     (filter #(cond (and dir? file?) true
                                    (and dir? (not file?)) (. %1 isDirectory)
                                    (and (not dir?) file?) (not (. %1 isDirectory))
                                    :else                  false)
                             (. absolute-dir listFiles))]
    (map #(. %1 getName) children)))

(defn get-resource-children
  [relative-dir-path dir? file?]
  (let [resource (io/resource relative-dir-path)
        protocol (if (nil? resource) nil (. resource getProtocol))]
    (cond (nil? protocol)     nil
          (= "file" protocol) (let [file     (io/as-file resource)
                                    children (filter #(cond (and dir? file?) true
                                                            (and dir? (not file?)) (. %1 isDirectory)
                                                            (and (not dir?) file?) (not (. %1 isDirectory))
                                                            :else                  false)
                                                     (. file listFiles))]
                                (map #(. %1 getName) children))
          (= "jar" protocol)  (let [jar-path (get-jar-path resource)]
                                (get-jar-resource-children jar-path relative-dir-path dir? file?))
          :else               nil)))

(defn ensure-directory
  []
  (let [systems-path (get-absolute-path "systems")
        systems-dir  (File. systems-path)]
    (if (not (. systems-dir exists))
        (. systems-dir mkdirs))))

(defn exists?
  [system-name]
  (let [system-path (format "%s/%s" (get-absolute-path "systems") system-name)
        system-dir  (File. system-path)]
    (and (. system-dir exists) (. system-dir isDirectory))))

(defn get-system-application-path
  [system-name application-name]
  (let [systems-path (get-absolute-path "systems")]
    (if (empty? system-name)
        systems-path
        (let [system-path (format "%s/%s" systems-path system-name)]
          (if (empty? application-name)
              system-path
              (format "%s/applications/%s" system-path application-name))))))

(defn get-default-file
  [file-name]
  (let [resource-path (get-resource-path (str "public/defaults/" file-name))]
    ;(get-resource resource-path)
    resource-path
    ))

(defn get-systems
  []
  (let [systems-path (get-absolute-path "systems")
        systems-dir  (File. systems-path)
        files        (. systems-dir listFiles)
        system-dirs  (filter #(. %1 isDirectory) files)
        systems      (map #(. %1 getName) system-dirs)]
    (json/write-str systems)))

(defn get-absolute-classes
  [system-name]
  (let [classes-path    (format "%s/%s" (get-system-application-path system-name "") "classes")
        class-dir-names (get-absolute-children classes-path true false)
        class-jsons     (map #(let [absolute-path (format "%s/%s/class.json" classes-path %1)]
                               (with-open [rdr (io/reader absolute-path)]
                                 (json/read rdr)))
                             class-dir-names)]
    class-jsons))

(defn get-resource-classes
  []
  (let [classes-path    (get-resource-path "public/classes")
        class-dir-names (get-resource-children classes-path true false)
        class-jsons     (map #(let [relative-path (format "%s/%s/class.json" classes-path %1)
                                    resource      (io/resource relative-path)]
                               (with-open [stream (io/input-stream resource)]
                                 (json/read-str (slurp stream))))
                             class-dir-names)]
    class-jsons))

(defn get-classes
  [system-name]
  (let [resource-class-jsons    (get-resource-classes)
        absolute-class-jsons    (get-absolute-classes system-name)]
    (json/write-str (concat resource-class-jsons absolute-class-jsons))))
  
(defn get-resources-list
  []
  (json/write-str (get-resource-children "public/defaults" true false)))

(defn response-with-content-type
  [resp content-type]
  (-> resp
      (response/header "Contents-Type" content-type)))

(defn get-file
  [system-name application-name file-name content-type]
  ;(let [path (get-target-path system-name application-name)
  ;      res  (response/file-response path)]
  ;  (response-with-content-type res content-type)))
  (let [absolute-path (str (get-system-application-path system-name application-name) "/" file-name)
        file (File. absolute-path)
        res  (if (. file exists)
                 (response/file-response absolute-path)
                 (response/resource-response (get-default-file file-name)))]
    (response-with-content-type res content-type)))
  
(defn get-data
  [system-name application-name api-name content-type]
  (response-with-content-type
    (response/response
      (cond (= api-name "systems")
              (get-systems)
            (= api-name "classes")
              (get-classes system-name)
            (= api-name "resources_list")
              (get-resources-list)
            :else
              nil))
    "text/json; charset=utf-8"))
