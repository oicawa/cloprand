(ns cloprand.core)

(defn return-raw-value [value]
  value)
(defn is-date-time? [value]
  true)

(def data-types {:text       {:generator "" :validator true :editor return-raw-value :renderer return-raw-value}
                 :text-lines {:generator "" :validator true :editor return-raw-value :renderer return-raw-value}
                 :boolean    {:generator true :validator true :editor return-raw-value :renderer return-raw-value}
                 :number     {:generator 0 :validator true :editor return-raw-value :renderer return-raw-value}
                 :enum       {:generator nil :validator true :editor nil :renderer return-raw-value}
                 :datetime   {:generator nil :validator is-date-time? :editor return-raw-value :renderer return-raw-value}
                 :binary     {:generator nil :validator true :editor return-raw-value :renderer return-raw-value}})

(defn deffield [name data-type & options]
  ;;; Check the 'data-type' exists in 'data-types' array.
  (let [base-options (data-types data-type)
        base-config  {:name name
                      :data-type data-type
                      :generator (base-options :generator)
                      :validator (base-options :validator)
                      :editor    (base-options :editor)
                      :renderer  (base-options :renderer) }]
    (loop [config base-config
           item   (take 2 options)
           dst    (drop 2 options)]
      (if (< (count item) 2)
          config
          (let [k (first item)
                v (second item)]
            (recur (assoc config k v) (take 2 dst) (drop 2 dst)))))))
