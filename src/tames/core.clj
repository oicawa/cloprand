(ns tames.core
  (:gen-class)
  (:require [clojure.tools.cli :refer [parse-opts]]
            [compojure.core :refer :all]
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

(defn init
  ([]
   (init (get (System/getenv) "TAMES_CONFIG_PATH" nil)))
  ([config-path]
   (log/info "Initializing...")
   (let [result (and (fonts/init)
                     (systems/init)
                     (config/init config-path))]
     (when (not result)
           (log/fatal "Initialization was failed. System shutdown...")
           (. (Runtime/getRuntime) exit 1)))))

;; WITH [Authentication] -> [Authorization]
(def app
  (let [rules   [{:pattern #"^(?!/login).*$" :handler authenticated?}]
        backend (session-backend {:unauthorized-handler handler/unauthorized})]
    (-> handler/app-routes
        (wrap-access-rules {:rules rules :policy :allow})
        (wrap-authentication backend)
        (wrap-authorization backend)
        ;(wrap-defaults site-defaults)
        (wrap-defaults (assoc-in site-defaults [:security :anti-forgery] false))
        )))

(def cli-options
  [["-c" "--config CONFIG_PATH" "Configuration file path."
    :default nil]
   ["-p" "--port PORT" "Port number."
    :default 3000
    :parse-fn #(Integer/parseInt %)
    :validate [#(< 0 % 0x10000) "Must be a number between 0 and 65536"]]])

(defn -main
  [& args]
  (let [options     (parse-opts args cli-options)
        config-path (get-in options [:options :config])
        port        (get-in options [:options :port])]
    (init config-path)
    (server/run-jetty app {:port port})))
