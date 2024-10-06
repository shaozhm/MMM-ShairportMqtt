### Steps:
1. Add module into config.js
    ``` sh
    $> cd ./magic-mirror/config
    $> vi config.js
    ```
    The config.js file:
    ``` text

    ... ...

        modules: [
                {
                        module: "alert",
                },
                {
                        module: "MMM-FlipClock",
                        position: "top_left",
                        config: {
                                timezone: "Asia/ShangHai",
                                displaySeconds: false,
                                dateFormat: 'dddd L',
                        },
                },
                {
                        module: 'MMM-ShairportMqtt',
                        header: "Shairport Sync",
                        position: 'top_right', // Or any valid MagicMirror position.
                        config: {
                                        // See 'Configuration options' for more information.
                        }
                },
                {
                        module: 'MMM-connection-status',
                        header: "Internet Connection",
                        position: 'top_left', // Or any valid MagicMirror position.
                        config: {
                                        // See 'Configuration options' for more information.
                        }
                },
        ]
    ... ...
    ```
