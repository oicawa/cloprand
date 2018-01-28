(ns tames.operations.fonts
  (:require [clojure.data.json :as json]
            [ring.util.response :as response])
  (:import (java.awt GraphicsEnvironment)))

(defn get-family-names
  [data]
  (let [ge    (GraphicsEnvironment/getLocalGraphicsEnvironment)
        names (. ge getAvailableFontFamilyNames)]
    (-> (response/response (json/write-str (vec names)))
        (response/header "Contents-Type" "text/json; charset=utf-8"))))
