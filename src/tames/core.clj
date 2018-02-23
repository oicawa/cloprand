(ns tames.core
  (:gen-class)
  (:use ring.adapter.jetty)
  (:require [compojure.core :refer :all]
            [compojure.handler]
            [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
            [buddy.auth :refer [authenticated?]]
            [buddy.auth.backends.session :refer [session-backend]]
            [buddy.auth.middleware :refer [wrap-authentication wrap-authorization]]
            [buddy.auth.accessrules :refer [wrap-access-rules]]
            [tames.handler :as handler]
            [tames.systems :as systems]
            [tames.operations.fonts :as fonts]))

(defn init
  []
  (println "init method called.")
  (fonts/init)
  (systems/init))

;;; NO AUTH
;(def app
;  (compojure.handler/site handler/app-routes))

;; WITH [Authentication] -> [Authorization]
(def app
  ;(let [rules   [{:pattern #"^(?!/login).*$" :handler authenticated?}]
  (let [rules   [{:pattern #"^(?!/login).*$" :handler authenticated?}]
  ;(let [rules   [{:pattern #"^/index.*$" :handler authenticated?}]
        backend (session-backend {:unauthorized-handler handler/unauthorized})]
    (-> handler/app-routes
        (wrap-access-rules {:rules rules :policy :allow})
        (wrap-authentication backend)
        (wrap-authorization backend)
        ;(wrap-defaults site-defaults)
        (wrap-defaults (assoc-in site-defaults [:security :anti-forgery] false))
        )))

(defn -main []
  (let [port (Integer/parseInt (get (System/getenv) "PORT" "3000"))]
    (init)
    (run-jetty app {:port port})))

