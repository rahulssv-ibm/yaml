import fold from '../src/foldFlowLines'
import YAML from '../src/index'
import { strOptions } from '../src/schema/_string'

describe('plain', () => {
  const src = 'abc def ghi jkl mno pqr stu vwx yz\n'
  let onFold
  let options
  beforeEach(() => {
    onFold = jest.fn()
    options = { indent: '', indentAtStart: 0, lineWidth: 10, minContentWidth: 0, onFold }
  })

  test('pass-through', () => {
    options.lineWidth = 40
    expect(fold(src, options)).toBe(src)
    expect(onFold).not.toHaveBeenCalled()
  })

  test('simple', () => {
    options.lineWidth = 20
    expect(fold(src, options)).toBe('abc def ghi jkl mno\npqr stu vwx yz\n')
    expect(onFold).toHaveBeenCalled()
  })

  test('multiple folds', () => {
    expect(fold(src, options)).toBe('abc def\nghi jkl\nmno pqr\nstu vwx yz\n')
    expect(onFold).toHaveBeenCalledTimes(1)
  })

  test('indent', () => {
    options.indent = '  '
    expect(fold(src, options)).toBe('abc def\n  ghi jkl\n  mno pqr\n  stu vwx\n  yz\n')
  })

  test('indent > lineWidth', () => {
    options.indent = '        '
    options.lineWidth = 7
    const i = '\n' + options.indent
    expect(fold(src, options)).toBe(`abc def${i}ghi${i}jkl${i}mno${i}pqr${i}stu${i}vwx${i}yz\n`)
  })

  test('indent > lineWidth, with minContentWidth', () => {
    options.indent = '        '
    options.lineWidth = 7
    options.minContentWidth = 7
    const i = '\n' + options.indent
    expect(fold(src, options)).toBe(`abc def${i}ghi jkl${i}mno pqr${i}stu vwx${i}yz\n`)
  })

  test('positive indentAtStart', () => {
    options.indentAtStart = 8
    expect(fold(src, options)).toBe('abc\ndef ghi\njkl mno\npqr stu\nvwx yz\n')
  })

  test('negative indentAtStart', () => {
    options.indentAtStart = -8
    expect(fold(src, options)).toBe('abc def ghi jkl\nmno pqr\nstu vwx yz\n')
  })

  test('doubled spaces', () => {
    const src2 = 'abc  def  ghi  jkl  mno  pqr  stu  vwx  yz\n'
    expect(fold(src2, options)).toBe(src2)
    expect(onFold).not.toHaveBeenCalled()
  })
})

describe('double-quoted', () => {
  const src = '"abc def ghi jkl mnopqrstuvwxyz\n"'
  let onFold
  let options
  beforeEach(() => {
    onFold = jest.fn()
    options = { indent: '', indentAtStart: 0, lineWidth: 10, minContentWidth: 0, mode: 'quoted', onFold }
  })

  test('pass-through', () => {
    options.lineWidth = 40
    expect(fold(src, options)).toBe(src)
    expect(onFold).not.toHaveBeenCalled()
  })

  test('simple', () => {
    options.lineWidth = 20
    expect(fold(src, options)).toBe('"abc def ghi jkl\nmnopqrstuvwxyz\n"')
    expect(onFold).toHaveBeenCalled()
  })

  test('multiple folds', () => {
    expect(fold(src, options)).toBe('"abc def\nghi jkl\nmnopqrstu\\\nvwxyz\n"')
    expect(onFold).toHaveBeenCalledTimes(1)
  })

  test('short lineWidth', () => {
    options.lineWidth = 3
    expect(fold(src, options)).toBe('"a\\\nbc\ndef\nghi\njkl\nmn\\\nop\\\nqr\\\nst\\\nuv\\\nwx\\\nyz\n"')
  })

  test('doubled spaces', () => {
    const src2 = '"abc  def  ghi  jkl  mno  pqr  stu  vwx  yz\n"'
    options.lineWidth = 9
    expect(fold(src2, options)).toBe('"abc  de\\\nf  ghi  \\\njkl  mno  \\\npqr  stu  \\\nvwx  yz\n"')
  })
})

describe('block folds', () => {
  let origFoldOptions

  beforeAll(() => {
    origFoldOptions = strOptions.fold
    strOptions.fold = {
      lineWidth: 20,
      minContentWidth: 0
    }
  })

  afterAll(() => {
    strOptions.fold = origFoldOptions
  })

  test('more-indented', () => {
    const src = `> # comment with an excessive length that won't get folded
Text on a line that
should get folded
with a line width of
20 characters.

  Indented text
  that appears to be
folded but is not.

  Text that is prevented from folding due to being more-indented.

Unfolded paragraph.\n`
    const doc = YAML.parseStream(src)[0]
    expect(doc.contents.value).toBe(
`Text on a line that should get folded with a line width of 20 characters.

  Indented text
  that appears to be
folded but is not.

  Text that is prevented from folding due to being more-indented.

Unfolded paragraph.\n`
    )
    expect(String(doc)).toBe(src)
  })
})
