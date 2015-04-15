(ns cloprand.core
  (:gen-class)
  (:use ring.adapter.jetty)
  (:require [compojure.core :refer :all]
            [compojure.handler]
            [cloprand.handler :as handler]
            [cloprand.systems :as systems]))

(defn init
  []
  (println "init method called.")
  (systems/ensure-directory "systems"))

(def app
  (compojure.handler/site handler/app-routes))

(defn -main []
  (let [port (Integer/parseInt (get (System/getenv) "PORT" "3000"))]
    (init)
    (run-jetty app {:port port})))

