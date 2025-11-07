<?php
defined('TYPO3') || die();

use TYPO3\CMS\Core\Utility\ExtensionManagementUtility;

$ll = 'LLL:EXT:jssitepackage/Resources/Private/Language/locallang_db.xlf:pages.tx_jssitepackage_megaimage';

ExtensionManagementUtility::addTCAcolumns('pages', [
    'tx_jssitepackage_megaimage' => [
        'exclude' => 1,
        'label' => $ll,
        'config' => [
            // Seit TYPO3 v9+ braucht "type=file" KEINE DB-Spalte in "pages"
            'type' => 'file',
            'maxitems' => 1,
            'appearance' => [
                'createNewRelationLinkTitle' => $ll . '.add',
            ],
            'allowed' => 'common-image-types', // nutzt die globalen Bildtypen
        ],
    ],
]);

// Feld in allen Page-Typen anzeigen (Position: nach "title")
ExtensionManagementUtility::addToAllTCAtypes(
    'pages',
    '--div--;LLL:EXT:core/Resources/Private/Language/Form/locallang_tabs.xlf:media,tx_jssitepackage_megaimage',
    '',
    'after:title'
);
