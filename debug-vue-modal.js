// 구축사례 관리 수정 기능 테스트 파일
// 브라우저 콘솔에서 실행할 수 있는 코드

// Vue 인스턴스 접근
const vm = window.v || Vue.component.instances[0]

if (vm) {
  console.log('=== Vue 인스턴스 데이터 확인 ===')
  console.log('editForm:', vm.editForm)
  console.log('isEditModalOpen:', vm.isEditModalOpen)
  console.log('constructionCases 개수:', vm.constructionCases.length)
  
  // 테스트용 데이터로 editForm 설정
  console.log('\n=== 테스트 데이터 설정 ===')
  vm.editForm = {
    id: 1,
    NO: 1,
    고객사: '테스트 고객사',
    사업명: '테스트 사업명',
    사업기간: '2025.01 ~ 2025.12'
  }
  
  // 모달 열기
  vm.isEditModalOpen = true
  
  console.log('테스트 완료. 모달이 열리고 데이터가 표시되어야 합니다.')
  
  // 1초 후 입력 필드 확인
  setTimeout(() => {
    const inputs = document.querySelectorAll('.modal.is-active input[type="text"]')
    console.log('\n=== 입력 필드 값 확인 ===')
    inputs.forEach((input, index) => {
      console.log(`Input ${index}: placeholder="${input.placeholder}", value="${input.value}"`)
    })
  }, 1000)
} else {
  console.error('Vue 인스턴스를 찾을 수 없습니다.')
}
