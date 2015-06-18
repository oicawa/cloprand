(ns tames.core
  (:gen-class)
  (:use ring.adapter.jetty)
  (:require [compojure.core :refer :all]
            [compojure.handler]
            [tames.handler :as handler]
            [tames.systems :as systems]))

(defn init
  []
  (println "init method called.")
  (systems/init))

(def app
  (compojure.handler/site handler/app-routes))

(defn -main []
  (let [port (Integer/parseInt (get (System/getenv) "PORT" "3000"))]
    (init)
    (run-jetty app {:port port})))

