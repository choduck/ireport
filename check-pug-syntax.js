const fs = require('fs')
const path = require('path')

// construction-cases-manage.pug 파일 읽기
const pugFile = path.join(__dirname, 'pug/admin/construction-cases-manage.pug')
const content = fs.readFileSync(pugFile, 'utf8')

// Vue 템플릿 내 문제가 될 수 있는 부분 확인
console.log('=== Pug 파일 구문 검사 ===')

// 주석 확인
const commentMatches = content.match(/\/\/.*/g)
if (commentMatches) {
  console.log('발견된 주석:')
  commentMatches.forEach((comment, index) => {
    console.log(`  ${index + 1}. ${comment}`)
  })
}

// Vue 템플릿 구문 확인
const vueTemplateRegex = /\{\{[^}]+\}\}/g
const vueMatches = content.match(vueTemplateRegex)
if (vueMatches) {
  console.log('\nVue 템플릿 구문:')
  vueMatches.forEach((template, index) => {
    console.log(`  ${index + 1}. ${template}`)
  })
}

// 모달 섹션 추출
const modalStart = content.indexOf('.modal(:class=')
const modalEnd = content.indexOf('include common/tnb-admin.pug')
if (modalStart !== -1 && modalEnd !== -1) {
  const modalSection = content.substring(modalStart, modalEnd)
  console.log('\n=== 모달 섹션 (일부) ===')
  console.log(modalSection.substring(0, 500) + '...')
}

console.log('\n검사 완료')
