/*
 * 신상지도 — 시드 데이터 (개발용 샘플)
 *
 * 이 파일의 판매처 제보는 전부 개발용 샘플이며 실제 매장·재고 정보가
 * 아닙니다. 좌표는 행정구 중심의 대략적인 위치이고("정확한 주소 아님"),
 * 매장명은 상호를 특정하지 않는 일반 표기만 사용합니다.
 * 실제 제보는 GitHub Issues(stock-report 라벨)로 수집합니다.
 */
(function () {
  'use strict';

  var DAY_MS = 24 * 60 * 60 * 1000;

  /* 시드 상태(최근 확인/확인 필요/오래됨)가 항상 의미 있게 보이도록
   * 절대 시각 대신 로드 시점 기준 오프셋으로 생성한다. */
  function daysAgo(days) {
    return new Date(Date.now() - days * DAY_MS).toISOString();
  }

  window.SNACKMAP_DATA = {
    products: [
      {
        id: 'bianco-triple-peanut-butter',
        name: '비얀코 트리플 피넛&버터',
        brand: '라벨리',
        category: '아이스크림',
        isSample: false,
        description:
          'Instagram에서 화제가 된 신상 아이스크림. 아직 판매처 제보가 접수되지 않아 첫 제보를 기다리고 있어요. 아이스크림 할인점에서 보셨다면 제보해 주세요.',
        keywords: ['비얀코', '트리플', '피넛', '버터', '피넛버터', '아이스크림', '신상', '라벨리']
      },
      {
        id: 'sample-triple-choco-crunch',
        name: '트리플 초코 크런치바',
        brand: '개발용 샘플 제품',
        category: '아이스크림',
        isSample: true,
        description:
          '지도·리스트 화면을 시연하기 위한 개발용 샘플 제품입니다. 아래 제보들은 실제 매장 정보가 아닙니다.',
        keywords: ['트리플', '초코', '크런치', '아이스크림', '샘플']
      },
      {
        id: 'sample-honey-corn-mini',
        name: '허니 콘칩 미니',
        brand: '개발용 샘플 제품',
        category: '과자',
        isSample: true,
        description:
          '검색·정렬 흐름을 시연하기 위한 개발용 샘플 제품입니다. 아래 제보들은 실제 매장 정보가 아닙니다.',
        keywords: ['허니', '콘칩', '미니', '과자', '스낵', '샘플']
      }
    ],

    /*
     * sourceType: 'sample'(개발용 샘플) | 'user'(사용자 제보) | 'community'(커뮤니티 수집)
     * approx: true → 구 단위 대략 위치, 정확한 주소 아님
     * 좌표는 해당 구의 중심부 근사값이다.
     */
    reports: [
      {
        id: 'r-sample-001',
        productId: 'sample-triple-choco-crunch',
        storeName: '아이스크림 할인점 (상호 제보 없음)',
        region: '서울 마포구',
        lat: 37.5637,
        lng: 126.9084,
        approx: true,
        sourceType: 'sample',
        confirmedAt: daysAgo(1),
        price: 1200,
        memo: '개발용 샘플 제보입니다. 실제 매장 정보가 아닙니다.'
      },
      {
        id: 'r-sample-002',
        productId: 'sample-triple-choco-crunch',
        storeName: '무인 아이스크림 매장 (상호 제보 없음)',
        region: '서울 관악구',
        lat: 37.4784,
        lng: 126.9516,
        approx: true,
        sourceType: 'sample',
        confirmedAt: daysAgo(6),
        price: null,
        memo: '개발용 샘플 제보입니다. 실제 매장 정보가 아닙니다.'
      },
      {
        id: 'r-sample-003',
        productId: 'sample-triple-choco-crunch',
        storeName: '아이스크림 할인점 (상호 제보 없음)',
        region: '부산 해운대구',
        lat: 35.1631,
        lng: 129.1635,
        approx: true,
        sourceType: 'sample',
        confirmedAt: daysAgo(25),
        price: 1000,
        memo: null
      },
      {
        id: 'r-sample-004',
        productId: 'sample-honey-corn-mini',
        storeName: '동네 마트 (상호 제보 없음)',
        region: '서울 강서구',
        lat: 37.5510,
        lng: 126.8495,
        approx: true,
        sourceType: 'sample',
        confirmedAt: daysAgo(2),
        price: 1500,
        memo: '개발용 샘플 제보입니다. 실제 매장 정보가 아닙니다.'
      },
      {
        id: 'r-sample-005',
        productId: 'sample-honey-corn-mini',
        storeName: '스낵 할인 매장 (상호 제보 없음)',
        region: '서울 송파구',
        lat: 37.5145,
        lng: 127.1066,
        approx: true,
        sourceType: 'sample',
        confirmedAt: daysAgo(12),
        price: null,
        memo: null
      }
    ],

    suggestions: [
      '비얀코 트리플 피넛&버터',
      '트리플 초코 크런치바',
      '허니 콘칩 미니',
      '아이스크림',
      '과자'
    ],

    regions: [
      '서울 마포구', '서울 강서구', '서울 관악구', '서울 송파구', '서울 강남구',
      '서울 노원구', '경기 수원시', '경기 성남시', '인천 부평구', '부산 해운대구',
      '대구 수성구', '대전 서구', '광주 북구'
    ]
  };
})();
