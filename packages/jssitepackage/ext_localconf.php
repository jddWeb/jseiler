<?php
defined('TYPO3') or die();

call_user_func(static function () {
    // Übergangsweise nötig bis TYPO3 14: UserTSconfig manuell einbinden
    \TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addUserTSConfig(
        "@import 'EXT:jssitepackage/Configuration/TsConfig/User/User.tsconfig'"
    );

    // PageTSconfig für BackendLayouts (Übergangsphase)
    \TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addPageTSConfig(
        "@import 'EXT:jssitepackage/Configuration/TsConfig/Page/page.tsconfig'"
    );
});
