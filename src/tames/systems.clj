(ns tames.systems
  (:gen-class)
  (:use ring.adapter.jetty)
  (:require [clojure.java.io :as io]
            [ring.util.response :as response]
            [clojure.data.json :as json])
  (:import (java.io File InputStream)
           (java.util.jar JarFile JarEntry)
           (java.util UUID)))

(def OBJECT-FILE-NAME #"^[\w]{8}-[\w]{4}-[\w]{4}-[\w]{4}-[\w]{12}\.json$")

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
  [relative-dir-path]
  (let [systems-path (get-absolute-path relative-dir-path)
        systems-dir  (File. systems-path)]
    (if (and (. systems-dir exists) (not (. systems-dir isDirectory)))
        (. systems-dir delete))
    (if (not (. systems-dir exists))
        (. systems-dir mkdirs))))

(defn exists?
  [class-id]
  (let [class-dir-path (get-absolute-path class-id)
        class-dir      (File. class-dir-path)]
    (and (. class-dir exists) (. class-dir isDirectory))))

;(defn get-system-application-path
;  [system-name application-name]
;  (let [systems-path (get-absolute-path "systems")]
;    (if (empty? system-name)
;        systems-path
;        (let [system-path (format "%s/%s" systems-path system-name)]
;          (if (empty? application-name)
;              system-path
;              (format "%s/applications/%s" system-path application-name))))))

(defn get-default-file
  [file-name]
  (let [resource-path (get-resource-path (str "public/defaults/" file-name))]
    ;(get-resource resource-path)
    resource-path
    ))

;(defn get-systems
;  []
;  (let [systems-path (get-absolute-path "systems")
;        systems-dir  (File. systems-path)
;        files        (. systems-dir listFiles)
;        system-dirs  (filter #(. %1 isDirectory) files)
;        systems      (map #(let [config-path (str (. %1 getAbsolutePath) "/config.json")]
;                             (with-open [rdr (io/reader config-path)]
;                               (json/read rdr)))
;                          system-dirs)]
;    (json/write-str systems)))

(defn get-list
  [class-id]
  (let [class-dir-path (get-absolute-path class-id)
        class-dir      (File. class-dir-path)
        object-files   (filter #(and (not (. %1 isDirectory))
                                     (re-find OBJECT-FILE-NAME (. %1 getName)))
                               (. class-dir listFiles))
        objects        (map #(with-open [rdr (io/reader (. %1 getAbsolutePath))]
                              (json/read rdr))
                            object-files)]
    (json/write-str objects)))

;(defn get-absolute-classes
;  [system-name]
;  (let [classes-path    (format "%s/%s" (get-system-application-path system-name "") "classes")
;        class-dir-names (get-absolute-children classes-path true false)
;        class-jsons     (map #(let [absolute-path (format "%s/%s/class.json" classes-path %1)]
;                               (with-open [rdr (io/reader absolute-path)]
;                                 (json/read rdr)))
;                             class-dir-names)]
;    class-jsons))

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

;(defn get-classes
;  [system-name]
;  (let [resource-class-jsons    (get-resource-classes)
;        absolute-class-jsons    (get-absolute-classes system-name)]
;    (json/write-str (concat resource-class-jsons absolute-class-jsons))))

(defn get-resources-list
  []
  (json/write-str (get-resource-children "public/defaults" true false)))

(defn response-with-content-type
  [resp content-type]
  (-> resp
      (response/header "Contents-Type" content-type)))

(defn get-file
  [class-id file-name content-type]
  ;(let [path (get-target-path system-name application-name)
  ;      res  (response/file-response path)]
  ;  (response-with-content-type res content-type)))
  (let [absolute-path (get-absolute-path (str class-id "/" file-name))
        file          (File. absolute-path)
        res           (if (. file exists)
                          (response/file-response absolute-path)
                          (response/resource-response (get-default-file file-name)))]
    (response-with-content-type res content-type)))

(defn get-data
  [class-id]
  (response-with-content-type
    (response/response (get-list class-id))
    "text/json; charset=utf-8"))

(defn create-object
  [class-id params]
  (println "Called create-system function.")
  (let [dir-name    class-id
        object-id   (str (UUID/randomUUID))
        object-file (get-absolute-path (str class-id "/" object-id ".json"))
        object      (assoc params :uuid object-id)]
    (println "***:" params)
    (ensure-directory class-id)
    (with-open [w (io/writer object-file)]
      (json/write object w))))

(defn update-object
  [class-id object-id params]
  (println "Called update-object function.")
  (let [object-file    (File. (get-absolute-path (str class-id "/" object-id ".json")))]
    ;; !! CAUTION !!
    ;; Implement 'param' data check logic!!
    (with-open [w (io/writer object-file)]
      (json/write params w))))

(defn remove-file
  [file]
  (if (. file isDirectory)
      (doseq [child (. file listFiles)]
        (remove-file child)))
  (. file delete))
  
(defn delete-object
  [class-id object-id]
  (println "Called delete-object function.")
  (let [file (File. (get-absolute-path (str class-id "/" object-id ".json")))]
    (remove-file file)))

(defn post-data
  [class-id params]
  (println "Called post-data function.")
  (create-object class-id params)
  (println "Posted OK.")
  (response-with-content-type
    (response/response (get-list class-id))
    "text/json; charset=utf-8"))

(defn put-data
  [class-id object-id params]
  (println "Called put-data function.")
  (update-object class-id object-id params)
  (println "Put OK.")
  (response-with-content-type
    (response/response (get-list class-id))
    "text/json; charset=utf-8"))

(defn delete-data
  [class-id object-id]
  (println "Called delete-data function.")
  (delete-object class-id object-id)
  (println "Delete OK.")
  (response-with-content-type
    (response/response (get-list class-id))
    "text/json; charset=utf-8"))
