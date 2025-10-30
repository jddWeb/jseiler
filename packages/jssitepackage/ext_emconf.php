<?php

$EM_CONF[$_EXTKEY] = [
    'title' => 'JSsitepackage',
    'description' => '',
    'category' => 'templates',
    'constraints' => [
        'depends' => [
            'typo3' => '13.4.0-13.4.99',
            'fluid_styled_content' => '13.4.0-13.4.99',
            'rte_ckeditor' => '13.4.0-13.4.99',
        ],
        'conflicts' => [
        ],
    ],
    'autoload' => [
        'psr-4' => [
            'BueroJensDerDenker\\Jssitepackage\\' => 'Classes',
        ],
    ],
    'state' => 'stable',
    'uploadfolder' => 0,
    'createDirs' => '',
    'clearCacheOnLoad' => 1,
    'author' => 'Jens Seiler',
    'author_email' => 'buero@jensseiler.de',
    'author_company' => 'Büro Jens der Denker',
    'version' => '1.0.0',
];
