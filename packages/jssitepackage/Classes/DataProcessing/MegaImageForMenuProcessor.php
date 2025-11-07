<?php
declare(strict_types=1);

namespace JensSeiler\Jssitepackage\DataProcessing;

use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Core\Resource\FileRepository;
use TYPO3\CMS\Frontend\ContentObject\ContentObjectRenderer;
use TYPO3\CMS\Frontend\ContentObject\DataProcessorInterface;

final class MegaImageForMenuProcessor implements DataProcessorInterface
{
    public function process(
        ContentObjectRenderer $cObj,
        array $contentObjectConfiguration,
        array $processorConfiguration,
        array $processedData
    ): array {
        $menuKey   = (string)($processorConfiguration['as'] ?? 'menuMain');
        $fieldName = (string)($processorConfiguration['fieldName'] ?? 'tx_jssitepackage_megaimage');
        $targetKey = (string)($processorConfiguration['targetKey'] ?? 'megaImage');

        if (!isset($processedData[$menuKey]) || !is_array($processedData[$menuKey])) {
            return $processedData;
        }

        /** @var FileRepository $fileRepository */
        $fileRepository = GeneralUtility::makeInstance(FileRepository::class);

        $inject = function (&$items) use (&$inject, $fileRepository, $fieldName, $targetKey) {
            foreach ($items as &$item) {
                $uid = (int)($item['data']['uid'] ?? $item['uid'] ?? 0);
                if ($uid > 0) {
                    $refs = $fileRepository->findByRelation('pages', $fieldName, $uid);
                    if (!empty($refs)) {
                        $ref = $refs[0]; // maxitems=1
                        $file = $ref->getOriginalFile();
                        $publicUrl = $file->getPublicUrl();
                        $metaTitle = (string)($ref->getProperty('title') ?: $file->getProperty('title'));
                        $metaAlt   = (string)($ref->getProperty('alternative') ?: $file->getProperty('alternative'));

                        $item[$targetKey] = [
                            'publicUrl' => $publicUrl,
                            'title'     => $metaTitle,
                            'alt'       => $metaAlt,
                            'uid'       => $file->getUid(),
                        ];
                    }
                }
                if (!empty($item['children']) && is_array($item['children'])) {
                    $inject($item['children']);
                }
            }
        };

        $inject($processedData[$menuKey]);

        return $processedData;
    }
}
