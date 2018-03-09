(ns tames.operations.resource
  (:require [clojure.data.json :as json]
            [clojure.string :as string]
            [ring.util.response :as response]
            [tames.systems :as systems])
  (:import (java.io File)
           (java.text SimpleDateFormat)))

(defn time-to-ISO8601
  [time]
  (let [f   "yyyy-MM-dd'T'HH:mm:ss"
        sdf (SimpleDateFormat. f)]
    (. sdf format time)))

(defn properties
  [path]
  (let [file              #?=(systems/get-target-file path)
        last-modified     (. file lastModified)
        last-modified-str (time-to-ISO8601 last-modified)
        ]
    ;(println (format "[%s] %s" last-modified-str (. file getAbsolutePath)))
    (-> (response/response (json/write-str { "last-modified" last-modified-str }))
        (response/header "Contents-Type" "text/json; charset=utf-8"))))


