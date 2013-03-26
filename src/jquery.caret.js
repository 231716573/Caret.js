//@ sourceMappingURL=jquery.caret.map
/*
  Implement Github like autocomplete mentions
  http://ichord.github.com/At.js

  Copyright (c) 2013 chord.luo@gmail.com
  Licensed under the MIT license.
*/


/*
本插件操作 textarea 或者 input 内的插入符
只实现了获得插入符在文本框中的位置，我设置
插入符的位置.
*/


(function() {
  (function(factory) {
    if (typeof define === 'function' && define.amd) {
      return define(['jquery'], factory);
    } else {
      return factory(window.jQuery);
    }
  })(function($) {
    "use strict";
    var Caret, Mirror, methods, pluginName;

    pluginName = 'caret';
    Caret = (function() {
      function Caret($inputor) {
        this.$inputor = $inputor;
        this.dom_inputor = this.$inputor[0];
      }

      Caret.prototype.getPos = function() {
        var end, endRange, inputor, len, normalizedValue, pos, range, start, textInputRange;

        inputor = this.dom_inputor;
        inputor.focus();
        if (document.selection) {
          /*
          #assume we select "HATE" in the inputor such as textarea -> { }.
           *               start end-point.
           *              /
           * <  I really [HATE] IE   > between the brackets is the selection range.
           *                   \
           *                    end end-point.
          */

          range = document.selection.createRange();
          pos = 0;
          if (range && range.parentElement() === inputor) {
            normalizedValue = inputor.value.replace(/\r\n/g, "\n");
            /* SOMETIME !!!
             "/r/n" is counted as two char.
              one line is two, two will be four. balalala.
              so we have to using the normalized one's length.;
            */

            len = normalizedValue.length;
            /*
               <[  I really HATE IE   ]>:
                the whole content in the inputor will be the textInputRange.
            */

            textInputRange = inputor.createTextRange();
            /*                 _here must be the position of bookmark.
                             /
               <[  I really [HATE] IE   ]>
                [---------->[           ] : this is what moveToBookmark do.
               <   I really [[HATE] IE   ]> : here is result.
                              \ two brackets in should be in line.
            */

            textInputRange.moveToBookmark(range.getBookmark());
            endRange = inputor.createTextRange();
            /*  [--------------------->[] : if set false all end-point goto end.
              <  I really [[HATE] IE  []]>
            */

            endRange.collapse(false);
            /*
                            ___VS____
                           /         \
             <   I really [[HATE] IE []]>
                                      \_endRange end-point.
            
            " > -1" mean the start end-point will be the same or right to the end end-point
                     * simplelly, all in the end.
            */

            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
              start = end = len;
            } else {
              /*
                      I really |HATE] IE   ]>
                             <-|
                    I really[ [HATE] IE   ]>
                          <-[
                  I reall[y  [HATE] IE   ]>
              
                will return how many unit have moved.
              */

              start = -textInputRange.moveStart("character", -len);
              end = -textInputRange.moveEnd("character", -len);
            }
          }
        } else {
          start = inputor.selectionStart;
        }
        return start;
      };

      Caret.prototype.setPos = function(pos) {
        var inputor, range;

        inputor = this.dom_inputor;
        if (document.selection) {
          range = inputor.createTextRange();
          range.move("character", pos);
          return range.select();
        } else {
          return inputor.setSelectionRange(pos, pos);
        }
      };

      Caret.prototype.getPosition = function() {
        var $inputor, at_rect, format, h, html, mirror, offset, pos, start_range, x, y;

        $inputor = this.$inputor;
        format = function(value) {
          return value.replace(/</g, '&lt').replace(/>/g, '&gt').replace(/`/g, '&#96').replace(/"/g, '&quot').replace(/\r\n|\r|\n/g, "<br />");
        };
        pos = this.getPos();
        start_range = $inputor.val().slice(0, pos);
        html = "<span>" + format(start_range) + "</span>";
        html += "<span id='caret'>|</span>";
        mirror = new Mirror($inputor);
        at_rect = mirror.create(html).rect();
        offset = $inputor.offset();
        x = offset.left + at_rect.left - $inputor.scrollLeft();
        y = at_rect.top - $inputor.scrollTop();
        h = y + at_rect.bottom;
        return {
          left: x,
          top: y,
          height: h
        };
      };

      Caret.prototype.getOffset = function() {
        var $inputor, Sel, h, offset, pos, x, y;

        $inputor = this.$inputor;
        if (document.selection) {
          Sel = document.selection.createRange();
          x = Sel.boundingLeft + $inputor.scrollLeft();
          y = Sel.boundingTop + $(window).scrollTop() + $inputor.scrollTop();
          h = Sel.boundingHeight;
        } else {
          offset = $inputor.offset();
          pos = this.getPosition();
          x = offset.left + pos.left;
          y = offset.top + pos.top;
          h = pos.height;
        }
        return {
          left: x,
          top: y,
          height: h
        };
      };

      return Caret;

    })();
    Mirror = (function() {
      Mirror.prototype.css_attr = ["overflowY", "height", "width", "paddingTop", "paddingLeft", "paddingRight", "paddingBottom", "marginTop", "marginLeft", "marginRight", "marginBottom", "fontFamily", "borderStyle", "borderWidth", "wordWrap", "fontSize", "lineHeight", "overflowX", "text-align"];

      function Mirror($inputor) {
        this.$inputor = $inputor;
      }

      Mirror.prototype.mirrorCss = function() {
        var css,
          _this = this;

        css = {
          position: 'absolute',
          left: -9999,
          top: 0,
          zIndex: -20000,
          'white-space': 'pre-wrap'
        };
        $.each(this.css_attr, function(i, p) {
          return css[p] = _this.$inputor.css(p);
        });
        return css;
      };

      Mirror.prototype.create = function(html) {
        this.$mirror = $('<div></div>');
        this.$mirror.css(this.mirrorCss());
        this.$mirror.html(html);
        this.$inputor.after(this.$mirror);
        return this;
      };

      Mirror.prototype.rect = function() {
        var $flag, pos, rect;

        $flag = this.$mirror.find("#caret");
        pos = $flag.position();
        rect = {
          left: pos.left,
          top: pos.top,
          bottom: $flag.height() + pos.top
        };
        this.$mirror.remove();
        return rect;
      };

      return Mirror;

    })();
    methods = {
      pos: function(pos) {
        if (pos) {
          return this.setPos(pos);
        } else {
          return this.getPos();
        }
      },
      position: function() {
        return this.getPosition();
      },
      offset: function() {
        return this.getOffset();
      }
    };
    return $.fn.caret = function(method) {
      var caret;

      caret = new Caret(this);
      if (methods[method]) {
        return methods[method].apply(caret, Array.prototype.slice.call(arguments, 1));
      } else {
        return $.error("Method " + method + " does not exist on jQuery.caret");
      }
    };
  });

}).call(this);
