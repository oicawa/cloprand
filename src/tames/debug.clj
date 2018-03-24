(ns tames.debug
  (:require [clojure.pprint :as pprint]))

(defmacro ?=
  [x]
  `(let [res# ~x
         m#   ~(meta &form)]
    (println (format "?=[%s:%d,%d]" ~*file* (:line m#) (:column m#)))
    (pprint/pprint res#)
    res#
    ))

(defn debug-pprint
  [x]
  `(let [res#    ~x
         stacks# (. (Throwable.) getStackTrace)
         stack#  ((vec stacks#) 0)
         file#   (. stack# getFileName)
         line#   (. stack# getLineNumber)]
    (println (format "?=[%s:%d]" file# line#))
    (pprint/pprint res#)
    res#))
