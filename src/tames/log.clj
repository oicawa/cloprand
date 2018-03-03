(ns tames.log
  (:gen-class)
  (:require [clojure.pprint :as pprint]
            [clojure.java.io :as io]
            [clojure.data.json :as json]
            [clojure.string :as string])
  (:import (java.io File InputStream)
           (java.nio.file Paths Path Files StandardCopyOption CopyOption)
           (java.util.jar JarFile JarEntry)
           (java.util UUID Calendar)))

(defn- write
  [label base-format & args]
  (let [ex-format (format "[%s] %s" label base-format)
        message   (format ex-format args)]
    (println message)))

(defn fatal
  [base-format & args]
  (write "F" base-format args))

(defn error
  [base-format & args]
  (write "E" base-format args))

(defn info
  [base-format & args]
  (write "I" base-format args))
