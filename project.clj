(defproject cloprand "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :dependencies [[org.clojure/clojure "1.6.0"]
                 [org.clojure/java.jdbc "0.3.4"]
                 [compojure "1.1.8"]
                 [ring/ring-core "1.2.0"]
                 [ring/ring-json "0.2.0"]
                 [com.h2database/h2 "1.4.180"]]
  :plugins [[lein-ring "0.8.11"]]
  :ring {:handler cloprand.handler/app}
  :profiles
  {:dev {:dependencies [[javax.servlet/servlet-api "2.5"]
                        [ring-mock "0.1.5"]]}}
  :web-content "public")
