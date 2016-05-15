(ns tames.systems
  (:gen-class)
  (:use ring.adapter.jetty)
  (:require [clojure.pprint :as pprint]
            [clojure.java.io :as io]
            [ring.util.response :as response]
            [clojure.data.json :as json]
            [clojure.string :as string])
  (:import (java.io File InputStream)
           (java.nio.file Paths Path)
           (java.util.jar JarFile JarEntry)
           (java.util UUID)))

;(def REGEXP_UUID #"^[\w]{8}-[\w]{4}-[\w]{4}-[\w]{4}-[\w]{12}$")
(def REGEXP_UUID #"[\w]{8}-[\w]{4}-[\w]{4}-[\w]{4}-[\w]{12}")
(def REGEXP_OBJECT_FILE_NAME #"^[\w]{8}-[\w]{4}-[\w]{4}-[\w]{4}-[\w]{12}\.json$")
(def CLASS_ID "Class")
(def FIELD_KEY "key")

(def config (atom nil))

(defn get-absolute-path
  [relative-path]
  (. (File. relative-path) getAbsolutePath))

(defn get-resource-path
  [relative-path]
  (. (File. relative-path) getPath))

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


(defn get-resource-type
  [relative-dir-path dir? file?]
  (let [resource (io/resource relative-dir-path)
        protocol (if (nil? resource) nil (. resource getProtocol))]
    (cond (= "file" protocol) :file
          (= "jar" protocol)  :jar
          :else               :none)))

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

(defn is-class-only?
  [resource-path]
  (let [fields (string/split resource-path #"/")]
    (= (count fields) 1)))

(defn get-default-file
  [file-name]
  (let [resource-path (get-resource-path (str "tames/defaults/" file-name))]
    resource-path))

(defn get-file-extension
  [path]
  (let [start (. path lastIndexOf ".")
        ext   (if (= start -1)
                  ""
                  (. path substring (+ start 1)))]
    ext))

(defn get-object
  [path]
  (with-open [rdr (io/reader (format (if (= (get-file-extension path) "")
                                         "%s.json"
                                         "%s")
                                     path))]
    (json/read rdr)))

(defn get-file-contents
  [path]
  { "file_path" path "file_contents" (slurp path) })

(defn get-object-as-json
  [path]
  (json/write-str (if (= (get-file-extension path) "")
                      (get-object path)
                      (get-file-contents path))))
      
(defn get-objects
  [path]
  (let [dir     (File. path)
        objects (map #(let [is-dir? (. % isDirectory)
                            name    (. %1 getName)]
                       (cond is-dir?
                              {"name" name "dir" true}
                            (= (get-file-extension (. %1 getAbsolutePath)) "json")
                              (get-object (. %1 getAbsolutePath))
                            :else
                              {"name" name "dir" false}))
                     (sort (. dir listFiles)))]
    (json/write-str objects)))

(defn get-resource-classes
  []
  (let [classes-path    (get-resource-path "tames/classes")
        class-dir-names (get-resource-children classes-path true false)
        class-jsons     (map #(let [relative-path (format "%s/%s/class.json" classes-path %1)
                                    resource      (io/resource relative-path)]
                               (with-open [stream (io/input-stream resource)]
                                 (json/read-str (slurp stream))))
                             class-dir-names)]
    class-jsons))

(defn get-resources-list
  []
  (json/write-str (get-resource-children "tames/defaults" true false)))

(defn response-with-content-type
  [resp content-type]
  (-> resp
      (response/header "Contents-Type" content-type)))

(defn create-authorized-result
  [authorized? url]
  (let [resp (response/response (json/write-str { "url" url }))]
    (-> resp
        (response/status (if authorized? 200 401))
        (response/header "Contents-Type" "text/json; charset=utf-8")
        )))

(defn get-file
  [class-id file-name content-type]
  ;(println "  [systems/get-file]")
  ;(println "  class-id     :" class-id)
  ;(println "  file-name    :" file-name)
  ;(println "  content-type :" content-type)
  (let [absolute-path (get-absolute-path (str "data/" class-id "/" file-name))
        default-path  (get-default-file file-name)
        file          (File. absolute-path)
        res           (if (. file exists)
                          (response/file-response absolute-path)
                          ;(response/resource-response default-path)
                          (response/resource-response file-name {:root "tames/defaults"})
                          )]
    ;(println "  absolute-path:" absolute-path)
    ;(println "  default-path :" default-path)
    ;(println "  exists?      :" (. file exists))
    (response-with-content-type res content-type)))

(defn get-extension-file-list
  [class-id object-id]
  (println "  [systems/get-extension-file-list]")
  (println "  class-id     :" class-id)
  (println "  object-id    :" object-id)
  (let [absolute-path (get-absolute-path (str "data/" class-id "/" object-id "/extension"))
        file-list     (. (File. absolute-path) list)
        files         (map (fn [file_name] {"file_name" file_name})
                           file-list)
        body          (json/write-str files)]
    (pprint/pprint files)
    (response-with-content-type (response/response body) "text/json; charset=utf-8")))

(defn get-extension-file
  [class-id object-id file-name]
  (println "  [systems/get-extension-file]")
  (println "  class-id     :" class-id)
  (println "  object-id    :" object-id)
  (println "  file-name    :" file-name)
  (let [absolute-path (get-absolute-path (str "data/" class-id "/" object-id "/extension/" file-name))
        file_contents (slurp absolute-path)
        res           (response/file-response absolute-path)]
    (response-with-content-type
      (response/response (json/write-str { "file_name" file-name "file_contents" file_contents }))
      "text/text; charset=utf-8")))

(defn get-data
  [resource-path]
  (let [path       (get-absolute-path (str "data/" resource-path))
        file       (File. path)]
    (response-with-content-type
      (response/response (cond (. file isDirectory)
                                 (get-objects path)
                               (is-class-only? resource-path)
                                 (get-objects path)
                               :else
                                 (get-object-as-json path)))
      "text/json; charset=utf-8")))

(defn get-key-field
  [class-id]
  (let [path   (get-absolute-path (format "data/%s/%s" CLASS_ID class-id))
        klass  (get-object path)
        fields (klass "object_fields")]
    (loop [field       (first fields)
           rest-fields (rest fields)]
      (let [key-value (field FIELD_KEY)]
        (if (= key-value true)
            field
            (recur (first rest-fields) (rest rest-fields)))))))

(defn get-key-field-name
  [class-id]
  (let [field (get-key-field class-id)]
    (field "name")))

(defn is-key-field-uuid
  [class-id]
  (let [field     (get-key-field class-id)
        datatype  (field "datatype")
        primitive (datatype "primitive")]
    (= primitive "UUID")))

(defn create-object
  [class-id s-exp-data]
  (println "Called create-system function.")
  (let [key-name      (get-key-field-name class-id)
        object-id     (if (is-key-field-uuid class-id)
                          (str (UUID/randomUUID))
                          (s-exp-data key-name))
        relative-path (Paths/get (str "data/" class-id) (into-array String [(str object-id ".json")]))
        base-name     (. relative-path getFileName)
        dir-path      (. relative-path getParent)
        object-data   (assoc s-exp-data key-name object-id)]
    (println (format "  key-name  : %s" key-name))
    (println (format "  object-id : %s" object-id))
    (ensure-directory (. dir-path toString))
    (with-open [w (io/writer (. relative-path toString))]
      (json/write object-data w))
    object-data))

(defn update-object
  [class-id object-id s-exp-data]
  (println "Called update-object function.")
  (let [object-file (File. (get-absolute-path (str "data/" class-id "/" object-id ".json")))]
    ;; !! CAUTION !!
    ;; Implement 'param' data check logic!!
    (with-open [w (io/writer object-file)]
      (json/write s-exp-data w))))

(defn remove-file
  [file]
  (if (. file isDirectory)
      (doseq [child (. file listFiles)]
        (remove-file child)))
  (. file delete))
  
(defn delete-object
  [class-id object-id]
  (println "Called delete-object function.")
  (let [file (File. (get-absolute-path (str "data/" class-id "/" object-id ".json")))]
    (remove-file file)
    (if (= CLASS_ID class-id)
        (remove-file (File. (format "data/%s" object-id))))))

(defn post-data
  [class-id s-exp-data]
  (println "Called post-data function.")
  (println "----------")
  (pprint/pprint s-exp-data)
  (println "----------")
  (let [new-object     (create-object class-id s-exp-data)
        key-field-name (get-key-field-name class-id)
        path           (get-absolute-path (format "data/%s/%s" class-id (new-object key-field-name)))]
    (println "Posted OK.")
    (response-with-content-type
      (response/response (get-object-as-json path))
      "text/json; charset=utf-8")))

(defn post-extension-file
  [class-id object-id file-name file_contents]
  (println "Called post-extension-file function.")
  (println "----------")
  (pprint/pprint file_contents)
  (println "----------")
  (let [dir-path  (str "data/" class-id "/" object-id "/extension")
        file-path (get-absolute-path (str dir-path "/" file-name))]
    (ensure-directory dir-path)
    (with-open [w (io/writer file-path)]
      (. w write file_contents))
    (println "Posted OK.")
    (response-with-content-type
      (response/response (json/write-str { "file_name" file-name }))
      "text/json; charset=utf-8")))

(defn put-data
  [class-id object-id s-exp-data]
  (println "Called put-data function.")
  (println "----------")
  (pprint/pprint s-exp-data)
  (println "----------")
  (update-object class-id object-id s-exp-data)
  (println "Put OK.")
  (response-with-content-type
    (response/response (get-objects class-id))
    "text/json; charset=utf-8"))

(defn put-extension-file
  [class-id object-id file-name file_contents]
  (println "Called put-extension-file function.")
  (println "----------")
  (pprint/pprint file_contents)
  (println "----------")
  (let [dir-path  (str "data/" class-id "/" object-id "/extension")
        file-path (get-absolute-path (str dir-path "/" file-name))]
    (ensure-directory dir-path)
    (with-open [w (io/writer file-path)]
      (. w write file_contents))
    (println "Put OK.")
    (response-with-content-type
      (response/response (json/write-str { "file_name" file-name }))
      "text/json; charset=utf-8")))

(defn delete-data
  [class-id object-id]
  (println "Called delete-data function.")
  (delete-object class-id object-id)
  (println "Delete OK.")
  (response-with-content-type
    (response/response (get-objects class-id))
    "text/json; charset=utf-8"))

(defn delete-extension-file
  [class-id object-id file-name]
  (println "Called delete-extension-file function.")
  (let [dir-path  (str "data/" class-id "/" object-id "/extension")
        file-path (get-absolute-path (str dir-path "/" file-name))]
    (ensure-directory dir-path)
    (remove-file (File. file-path))
    (println "Delete OK.")
    (response-with-content-type
      (response/response (json/write-str { "file_name" file-name }))
      "text/json; charset=utf-8")))

(defn copy-resource-file
  [resource-path dest-path]
  (with-open [src (io/input-stream (io/resource resource-path))]
    (io/copy src (File. dest-path))))

(defn ensure-init-files
  [relative-path]
  (let [dirs  (get-resource-children (str "public/" relative-path) true false)
        files (get-resource-children (str "public/" relative-path) false true)]
    (if (or (nil? dirs) (nil? files))
        nil
        (do
          (ensure-directory relative-path)
          (doseq [dir dirs]
            (ensure-init-files (str relative-path "/" dir)))
          (doseq [file files]
            (let [src-path (str "public/" relative-path "/" file)
                  dst-path (str relative-path "/" file)]
              (println (format "[systems/ensure-init-files] %s" src-path))
              (if (not (. (File. (get-absolute-path dst-path)) exists))
                  (copy-resource-file src-path dst-path))
                  ))))))

(defn init
  []
  (ensure-init-files "lib")
  (ensure-init-files "data")
  )



