module.exports = grammar({
  name: "haml",

  extras: ($) => [
    /\s/, // Allow whitespace
    $.comment, // Allow comments
  ],

  rules: {
    document: ($) => repeat($._node),

    _node: ($) =>
      choice(
        $.doctype,
        $.tag,
        $.ruby_block,
        $.comment,
        $.html_comment,
        $.plain_filter,
        $.escaped_filter,
        $.erb_filter,
        $.ruby_filter,
        $.javascript_filter,
        $.css_filter,
        $.interpolation,
        $.erb_interpolation,
        $.attribute,
        $.self_closing,
        $.despacer,
        $.plain_char,
        $.error
      ),

    // Haml-specific constructs
    doctype: ($) => seq(/^\s*!!!/, /[^\n]*/),

    tag: ($) =>
      seq(
        "%",
        /[\w:]+/, // Match tag names
        optional($.attributes),
        optional($.class_char),
        optional($.id_char),
        optional($.ruby_block)
      ),

    attributes: ($) => seq("(", repeat(choice($.attribute, $.ruby_block)), ")"),

    attribute: ($) =>
      seq(
        /[\w\-]+/, // Attribute key
        "=",
        choice($.string, $.ruby_block)
      ),

    class_char: ($) => seq(".", /[\w\-:]+/),

    id_char: ($) => seq("#", /[\w\-]+/),

    ruby_block: ($) =>
      choice(
        seq(
          choice("=", "!=", "~"),
          /[^\n]+/ // Ruby code until end of line
        ),
        seq("-", /[^\n]+/)
      ),

    plain_char: ($) => token("\\"),

    interpolation: ($) => seq("&=", $.string),

    erb_interpolation: ($) =>
      seq("<%", optional("="), optional("-"), /[^\n]*?%>/),

    string: ($) =>
      choice(seq("'", repeat(/[^']*/), "'"), seq('"', repeat(/[^"]*/), '"')),

    comment: ($) => seq(/^\s*-#/, /[^\n]*/),

    html_comment: ($) => seq(/^\s*\//, /[^\n]*/),

    plain_filter: ($) =>
      seq(
        /^\s*:/,
        choice(
          "plain",
          "preserve",
          "redcloth",
          "textile",
          "markdown",
          "maruku"
        ),
        repeat($._filter_content)
      ),

    escaped_filter: ($) =>
      seq(/^\s*:/, choice("escaped", "cdata"), repeat($._filter_content)),

    erb_filter: ($) => seq(/^\s*:/, "erb", repeat($._filter_content)),

    ruby_filter: ($) => seq(/^\s*:/, "ruby", repeat($._filter_content)),

    javascript_filter: ($) =>
      seq(/^\s*:/, "javascript", repeat($._filter_content)),

    css_filter: ($) => seq(/^\s*:/, "css", repeat($._filter_content)),

    _filter_content: ($) =>
      choice(
        $.html_comment,
        $.interpolation,
        $.erb_interpolation,
        $.ruby_block,
        $.tag
      ),

    self_closing: ($) => seq("/", optional($.ruby_block)),

    despacer: ($) => choice(token("<>"), token("/")),

    error: ($) => token("$"),

    // HTML integration
    html_tag: ($) =>
      seq(
        "<",
        optional("/"),
        $.html_tag_name,
        repeat(choice($.html_attribute, $.html_event)),
        optional("/"),
        ">"
      ),

    html_tag_name: ($) => /[\w:]+/,

    html_attribute: ($) => seq(/[\w\-]+/, optional(seq("=", $.string))),

    html_event: ($) => seq(/on\w+/, "=", choice($.string, $.javascript)),

    // Embedded JavaScript
    javascript: ($) =>
      choice(
        $.javascript_string,
        $.javascript_template_string,
        $.javascript_number,
        $.javascript_keyword,
        $.javascript_identifier,
        $.javascript_expression
      ),

    javascript_string: ($) =>
      choice(seq('"', repeat(/[^"]*/), '"'), seq("'", repeat(/[^']*/), "'")),

    javascript_template_string: ($) =>
      seq(
        "`",
        repeat(
          choice(
            $.javascript_template_chars,
            $.javascript_template_substitution
          )
        ),
        "`"
      ),

    javascript_template_chars: ($) => /[^`$\\]+/,

    javascript_template_substitution: ($) =>
      seq("${", $.javascript_expression, "}"),

    javascript_number: ($) => /\d+(\.\d+)?/,

    javascript_keyword: ($) =>
      choice(
        "if",
        "else",
        "switch",
        "for",
        "while",
        "do",
        "break",
        "continue",
        "function",
        "return",
        "with",
        "try",
        "catch",
        "finally",
        "throw",
        "typeof",
        "instanceof",
        "new",
        "delete",
        "await",
        "yield"
      ),

    javascript_identifier: ($) => /[a-zA-Z_$][\w$]*/,

    javascript_expression: ($) =>
      choice(
        $.javascript_string,
        $.javascript_template_string,
        $.javascript_number,
        $.javascript_identifier,
        seq($.javascript_expression, ".", $.javascript_identifier),
        seq(
          $.javascript_expression,
          "(",
          optional($.javascript_arguments),
          ")"
        ),
        seq($.javascript_expression, "[", $.javascript_expression, "]")
      ),

    javascript_arguments: ($) =>
      seq($.javascript_expression, repeat(seq(",", $.javascript_expression))),

    // Embedded Ruby
    ruby_expression: ($) =>
      choice(
        $.ruby_method_call,
        $.ruby_variable,
        $.ruby_literal,
        $.ruby_operator
      ),

    ruby_method_call: ($) =>
      seq(
        $.ruby_identifier,
        optional(seq("(", optional($.ruby_arguments), ")"))
      ),

    ruby_variable: ($) => /[@$]?\w+/,

    ruby_literal: ($) =>
      choice($.string, $.ruby_number, "true", "false", "nil"),

    ruby_number: ($) => /\d+(\.\d+)?/,

    ruby_identifier: ($) => /[a-zA-Z_]\w*/,

    ruby_operator: ($) =>
      choice(
        "=",
        "==",
        "!=",
        "<",
        ">",
        "<=",
        ">=",
        "+",
        "-",
        "*",
        "/",
        "%",
        "&&",
        "||",
        "!",
        "!"
      ),

    ruby_arguments: ($) =>
      seq($.ruby_expression, repeat(seq(",", $.ruby_expression))),
  },
});
