(ns tames.operations.fonts
  (:require [clojure.data.json :as json]
            [clojure.pprint :as pprint]
            [clojure.string :as string]
            [ring.util.response :as response])
  (:import (java.io File)
           (java.awt Font GraphicsEnvironment)
           (sun.font FontManagerFactory)
           (java.util Locale)))

(defn get-ttf-font-file-paths
  []
  (let [font-manager (FontManagerFactory/getInstance)
        ;; Separator character
        ;; - Linux   ... ':'
        ;; - Windows ... ??? (It seems that the font path is only one. For now, we don't judge separator character for windows.)
        font-dir-paths  (string/split (. font-manager getPlatformFontPath true) #":")
        font-file-paths (map (fn [font-dir-path]
                               (let [directory (File. font-dir-path)
                                     files     (. directory listFiles)]
                                 (map (fn [file] (. file getAbsolutePath))
                                      (vec files))))
                             font-dir-paths)
        ttf-font-paths  (filter #(or (. %1 endsWith ".ttf")
                                     (. %1 endsWith ".otf"))
                                (flatten font-file-paths))]
    ;(pprint/pprint ttf-font-paths)
    (vec ttf-font-paths)))
  
(defn get-ttf-font-map
  [ttf-font-paths]
  (loop [font-map   {}
         font-paths ttf-font-paths]
    (if (= (count font-paths) 0)
        font-map
        (let [font-path  (font-paths 0)
              rest-paths (subvec font-paths 1)
              font       (Font/createFont Font/TRUETYPE_FONT (File. font-path))
              font-name  (. font getName)
                         font-value { "name"   font-name
                                      "face"   (. font getFontName (Locale/JAPANESE))
                                      "family" (. font getFamily (Locale/JAPANESE))
                                      "path"   font-path}]
          (recur (assoc font-map font-name font-value) rest-paths)))))
  

;(def ttf-font-map (get-ttf-font-map (get-ttf-font-file-paths)))
(def ttf-font-map (ref nil))

(defn get-list
  [_]
  (if (nil? (deref ttf-font-map))
      (let [font-map (get-ttf-font-map (get-ttf-font-file-paths))]
        (pprint/pprint font-map)
        (dosync (ref-set ttf-font-map font-map))))
  ;(pprint/pprint (keys (deref ttf-font-map)))
  (-> (response/response (json/write-str (keys (deref ttf-font-map))))
      (response/header "Contents-Type" "text/json; charset=utf-8")))

(defn get-font-file-path
  [font-name]
  (get-in (deref ttf-font-map) [font-name "path"] nil))


