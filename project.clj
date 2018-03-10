(defproject tames "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :dependencies [[org.clojure/clojure "1.6.0"]
                 [org.clojure/java.jdbc "0.3.4"]
                 [org.clojure/data.json "0.2.3"]
                 [compojure "1.1.8"]
                 [ring/ring-core "1.2.1"]
                 [ring/ring-jetty-adapter "1.2.1"]
                 [ring/ring-json "0.2.0"]
                 [ring/ring-defaults "0.1.2"]
                 [buddy "0.6.1"]
                 [hiccup "1.0.5"]
                 [com.h2database/h2 "1.4.180"]
                 [com.itextpdf/itextpdf "5.5.12"]
                 [com.itextpdf/itext-asian "5.2.0"]
                 [org.clojure/tools.cli "0.3.5"]]
  :plugins [[lein-ring "0.8.11"]]
  :ring {:handler tames.core/app
         :main tames.core
         :init tames.core/init}
  :profiles {:uberjar {:aot :all}
             :dev {:dependencies [[javax.servlet/servlet-api "2.5"]
                                  [ring-mock "0.1.5"]]}}
  ;:web-content ""
  )
