(ns tames.core
  (:gen-class)
  (:require [compojure.core :refer :all]
            [compojure.handler]
            [ring.adapter.jetty :as server]
            [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
            [buddy.auth :refer [authenticated?]]
            [buddy.auth.backends.session :refer [session-backend]]
            [buddy.auth.middleware :refer [wrap-authentication wrap-authorization]]
            [buddy.auth.accessrules :refer [wrap-access-rules]]
            [tames.log :as log]
            [tames.config :as config]
            [tames.handler :as handler]
            [tames.systems :as systems]
            [tames.operations.fonts :as fonts]))

(defonce server (atom nil))

(defn init
  []
  (log/info "Initializing...")
  (let [result (and (fonts/init)
                    (systems/init)
                    (config/init))]
    (when (not result)
          (log/fatal "Initialization was failed. System shutdown...")
          (. (Runtime/getRuntime) exit 1))))

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

