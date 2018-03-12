(ns tames.operations.resource
  (:require [clojure.pprint :as pprint]
            [clojure.data.json :as json]
            [clojure.string :as string]
            [ring.util.response :as response]
            [tames.systems :as systems]
            [tames.log :as log])
  (:import (java.io File)
           (java.text SimpleDateFormat)))

(defn time-to-ISO8601
  [time]
  (let [f   "yyyy-MM-dd'T'HH:mm:ss"
        sdf (SimpleDateFormat. f)]
    (. sdf format time)))

(defn properties-list
  [paths]
  (let [properties-list (map #(let [file (systems/get-target-file %1)]
                               {"path"          %1
                                "last-modified" (time-to-ISO8601 (. file lastModified))})
                             paths)]
    (-> (response/response (json/write-str properties-list))
        (response/header "Contents-Type" "text/json; charset=utf-8"))))


