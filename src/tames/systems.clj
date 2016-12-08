(ns tames.systems
  (:gen-class)
  (:use ring.adapter.jetty)
  (:require [clojure.pprint :as pprint]
            [clojure.java.io :as io]
            [ring.util.response :as response]
            [clojure.data.json :as json]
            [clojure.string :as string])
  (:import (java.io File InputStream)
           (java.nio.file Paths Path Files StandardCopyOption)
           (java.util.jar JarFile JarEntry)
           (java.util UUID)))

;(def REGEXP_UUID #"^[\w]{8}-[\w]{4}-[\w]{4}-[\w]{4}-[\w]{12}$")
(def REGEXP_UUID #"[\w]{8}-[\w]{4}-[\w]{4}-[\w]{4}-[\w]{12}")
(def REGEXP_OBJECT_FILE_NAME #"^[\w]{8}-[\w]{4}-[\w]{4}-[\w]{4}-[\w]{12}\.json$")
(def OBJECT_ID_NAME "id")
(def CLASS_ID "a7b6a9e1-c95c-4e75-8f3d-f5558a264b35")
(def ACCOUNT_ID "9643597d-5513-4377-961c-643293fa3319")
(def GROUP_ID "Group")
(def FIELD_KEY "key")
(def FILES_ID "748189ad-ce16-43f6-ae2a-fa48e5ec4a39")
(def IMAGES_ID "4ee20d87-b73d-40a7-a521-170593ac2512")

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

(defn get-json-file
  [class-id object-id]
  (let [object-path (get-absolute-path (format "data/%s/%s.json" class-id object-id))]
    (File. object-path)))

(defn get-object
  [class-id object-id]
  (let [file (get-json-file class-id object-id)]
    (if (not (. file exists))
        nil
        (with-open [rdr (io/reader (. file getAbsolutePath))]
          (json/read rdr)))))

(defn get-file-contents
  [path]
  { "file_path" path "file_contents" (slurp path) })

(defn get-object-as-json
  [class-id object-id]
  (json/write-str (get-object class-id object-id)))

(defn get-json-files
  [class-id]
  (let [class-dir (File. (get-absolute-path (str "data/" class-id)))
        files     (filter #(. %1 isFile) (. class-dir listFiles))]
    files))

(defn get-objects
  [class-id]
  (let [files   (get-json-files class-id)
        objects (map #(with-open [rdr (io/reader (. %1 getAbsolutePath))]
                        (json/read rdr))
                     files)
        ids     (map #(%1 "id") objects)]
    (println ">>>>>>>>>>>>>>>>>>>>")
    (pprint/pprint objects)
    (println ">>>>>>>>>>>>>>>>>>>>")
    (pprint/pprint ids)
    (zipmap ids objects)))

(defn get-objects-as-json
  [class-id]
  (let [objects (get-objects class-id)]
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
  (let [absolute-path (get-absolute-path (str "data/" class-id "/" file-name))
        default-path  (get-default-file file-name)
        file          (File. absolute-path)
        res           (if (. file exists)
                          (response/file-response absolute-path)
                          (response/resource-response file-name {:root "tames/defaults"})
                          )]
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

(defn get-files-fields
  [class-id]
  (let [class_ (get-object CLASS_ID class-id)]
    (filter #(let [id ((%1 "datatype") "id")]
               (or (= id FILES_ID)
                   (= id IMAGES_ID)))
            (class_ "object_fields"))))

(defn remove-attached-files
  [class-id object-id value files_fields]
  (doseq [field files_fields]
    (let [dst-dir-path (get-absolute-path (format "data/%s/.%s/%s" class-id, object-id (field "name")))
          file-names   (keys ((value (field "name")) "remove"))]
      (doseq [file-name file-names]
        (let [file (File. (format "%s/%s" dst-dir-path file-name))]
          (println "[** Remove File **]" (. file getAbsolutePath))
          (if (. file exists)
              (. file delete)))))))

(defn save-attached-files
  [class-id object-id value files_fields added-files]
  (doseq [field files_fields]
    (let [dst-dir-path (format "data/%s/.%s/%s" class-id, object-id (field "name"))
          file-keys    (keys ((value (field "name")) "added"))]
      (ensure-directory dst-dir-path)
      (pprint/pprint file-keys)
      (doseq [file-key file-keys]
        (let [file      (added-files (keyword file-key))
              tmp-file  (file :tempfile)
              file-name (. (File. (file :filename)) getName)
              dst-file  (format "%s/%s" dst-dir-path file-name)]
          (io/copy tmp-file (File. dst-file)))))))

(defn update-files-values
  [class-id object-id files_fields raw-value]
  (let [base-dir   (get-absolute-path (format "data/%s/.%s" class-id object-id))
        field_names (map #(%1 "name") files_fields)]
    (loop [names field_names
           value raw-value]
      (if (empty? names)
          value
          (let [name    (first names)
                path    (format "%s/%s" base-dir name)
                current (map (fn [file] { "name" (. file getName) "size" (. file length) })
                             (vec (. (File. path) listFiles)))
                value1  (dissoc value name)
                value2  (assoc value name {"class_id" class-id "object_id" object-id "current" current})]
            (recur (rest names) value2))))))

(defn get-account
  [account_id]
  (let [accounts (filter #(= (%1 "account_id") account_id) (vals (get-objects ACCOUNT_ID)))
        account  (if (= (count accounts) 0) nil (first accounts))]
    (pprint/pprint accounts)
    account))

(defn get-last-modified
  [class-id object-id]
  (if (nil? object-id)
      (let [files (sort #(- (. %2 lastModified) (. %1 lastModified))
                        (get-json-files class-id))]
        (pprint/pprint (map #(. %1 lastModified) files))
        (. (first files) lastModified))
      (. (get-json-file class-id object-id) lastModified)))
  
(defn get-data
  [class-id object-id]
  (response-with-content-type
    (response/response (if (nil? object-id)
                           (get-objects-as-json class-id)
                           (get-object-as-json class-id object-id)))
    "text/json; charset=utf-8"))

(defn is-user-in-group
  [account-id group-id]
  (let [group    (get-object GROUP_ID group-id)
        accounts (group "acounts")]
    (loop [rest-accounts accounts]
      (cond (empty? rest-accounts) false
            (= account-id (first rest-accounts)) true
            :else (recur (rest rest-accounts))))))

;(defn is-user-accessible
;  [account-id 

(defn create-object
  [class-id object-id s-exp-data]
  (println "Called create-object function.")
  (let [relative-path (Paths/get (str "data/" class-id) (into-array String [(str object-id ".json")]))
        base-name     (. relative-path getFileName)
        dir-path      (. relative-path getParent)]
    (ensure-directory (. dir-path toString))
    (with-open [w (io/writer (. relative-path toString))]
      (json/write s-exp-data w))))

(defn update-object
  [class-id object-id s-exp-data]
  (println "Called update-object function.")
  (let [object-file (File. (get-absolute-path (str "data/" class-id "/" object-id ".json")))
        ;; !! CAUTION !!
        ;; Implement decode logic to decode the uploaded files data
        ;; 1. Extract uploaded files data.
        ;; 2. Delete the contents data only from s-exp-data.(Rest file name)
        ;; 3. Create UUID as saved real file name, and map uploaded file name.
        ;; 4. Save file data. (named UUID)
        ;s-exp-data2 (save-files-data s-exp-data)
        ]
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
  [class-id data added-files]
  (let [object-id    (str (UUID/randomUUID))
        files_fields (get-files-fields class-id)
        data-with-id (assoc data OBJECT_ID_NAME object-id)]
    ;(println "Called post-data function.")
    ;(println "----------")
    ;(pprint/pprint data)
    ;(println "----------")
    (save-attached-files class-id object-id data-with-id files_fields added-files)
    (let [pure-data (update-files-values class-id object-id files_fields data-with-id)]
      (create-object class-id object-id pure-data)
      (println "Posted OK.")
      (response-with-content-type
        (response/response (get-object-as-json class-id object-id))
        "text/json; charset=utf-8"))))

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
  [class-id object-id data added-files]
  (let [files_fields (get-files-fields class-id)]
    (remove-attached-files class-id object-id data files_fields)
    (save-attached-files class-id object-id data files_fields added-files)
    (let [pure-data (update-files-values class-id object-id files_fields data)]
      (update-object class-id object-id pure-data)
      (response-with-content-type
        (response/response (get-objects-as-json class-id))
        "text/json; charset=utf-8"))))

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
  (remove-file (File. (get-absolute-path (format "data/%s/.%s" class-id, object-id))))
  (println "Delete OK.")
  (response-with-content-type
    (response/response (get-objects-as-json class-id))
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
  [resource-path dst-path]
  (let [src-url       (io/resource resource-path)
        src-file      (File. (. src-url toURI))
        last-modified (. src-file lastModified)
        dst-file      (File. dst-path)
        ]
    (with-open [stream (io/input-stream src-url)]
      (io/copy stream dst-file))
    (. dst-file setLastModified last-modified)
    ))

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
              ;(println (format "[systems/ensure-init-files] %s" src-path))
              (if (not (. (File. (get-absolute-path dst-path)) exists))
                  (copy-resource-file src-path dst-path))
                  ))))))

(defn init
  []
  (ensure-init-files "lib")
  (ensure-init-files "core")
  (ensure-init-files "data"))



