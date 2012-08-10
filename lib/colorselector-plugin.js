/**
 * Aloha.Colorselector
 * The colorselector allows the change of color/backgroundcolor
 * Author: Updates from Jeremy Strouse, original from Simioana Mihai (Bluematrix LLC)
 * This is in parts based on the Aloha characterpicker plugin
 */

define(
[ 'aloha',
	'aloha/jquery',
	'aloha/plugin',
	'aloha/floatingmenu',
	'i18n!colorselector/nls/i18n',
	'i18n!aloha/nls/i18n',
        'css!colorselector/css/colorselector.css'],
function (Aloha, jQuery, Plugin, FloatingMenu,i18n, i18nCore){
    "use strict";
    var
		GENTICS = window.GENTICS,
		$ = jQuery,
		ns  = 'aloha-colorselector',
		uid = +new Date,
		animating = false;

    function Colorselector(colors, onSelectCallback) {
		var self = this;
        self.$colorArg = "";
		self.$node = jQuery('<table class="aloha-colorselector-overlay" role="dialog" style="cursor:pointer"><tbody></tbody></table>');
		// don't let the mousedown bubble up. otherwise there won't be an activeEditable
		self.$node.mousedown(function(e) {
			return false;
		});
		self.$tbody = self.$node.find('tbody');
		self.$node.appendTo(jQuery('body'));
		self._createColorButtons(self.$node, colors, onSelectCallback);
		self._initHideOnDocumentClick();
		self._initHideOnEsc();
		self._initCursorFocus(onSelectCallback);
		self._initEvents();
	}

    /**
         * Coverts hexidecimal string #00ffcc into rgb array [0, 255, 127]
         *
         * @param {String} hex - Hexidecimal string representing color. In the form
         *						 #ff3344 or #f34
         * @return {Array} rgb representation of hexidecimal color
         */
        function hex2rgb (hex) {
            var hex = hex.replace('#', '').split('');

            if (hex.length == 3) {
                hex[5] = hex[4] = hex[2];
                hex[3] = hex[2] = hex[1];
                hex[1] = hex[0];
            }

            var rgb = [];

            for (var i = 0; i < 3; ++i) {
                rgb[i] = parseInt('0x' + hex[i * 2] + hex[i * 2 + 1], 16);
            }

            return rgb;
        };

     // ------------------------------------------------------------------------
	// Plugin
	// ------------------------------------------------------------------------
    Colorselector.prototype = {
            show: function( insertButton, colorArg) {
                var self = this;
                // position the overlay relative to the insert-button
                self.$node.css(jQuery(insertButton).offset());
                self.$node.show();
                self.$colorArg = colorArg;
                // focus the first color
                self.$node.find('.focused').removeClass('focused');
                jQuery(self.$node.find('td')[0]).addClass('focused');
            },
            _initHideOnDocumentClick: function() {
                var self = this;
                // if the user clicks somewhere outside of the layer, the layer should be closed
                // stop bubbling the click on the create-dialog up to the body event
                self.$node.click(function(e) {
                    e.stopPropagation();
                });
                // hide the layer if user clicks anywhere in the body
                jQuery('body').click(function(e) {
                    var overlayVisibleAndNotTarget
                        =  (self.$node.css('display') === 'table')
                        && (e.target != self.$node[0])
                        // don't consider clicks to the 'show' button.
                        && !jQuery(e.target).is('button.aloha-button-colorselector')
                        && !jQuery(e.target).is('button.aloha-button-fontcolorselector');
                    if(overlayVisibleAndNotTarget) {
                        self.$node.hide();
                    }
                });
            },
            _initHideOnEsc: function() {
                var self = this;
                // escape closes the overlay
                jQuery(document).keyup(function(e) {
                    var overlayVisibleAndEscapeKeyPressed = (self.$node.css('display') === 'table') && (e.keyCode === 27);
                    if(overlayVisibleAndEscapeKeyPressed) {
                        self.$node.hide();
                    }
                });
            },
            _initCursorFocus: function( onSelectCallback ) {
                var self = this;
                // you can navigate through the color table with the arrow keys
                // and select one with the enter key
                var $current, $next, $prev, $nextRow, $prevRow;
                var movements = {
                    13: function select() {
                        $current = self.$node.find('.focused');
                        self.$node.hide();
                        onSelectCallback($current.text());
                    },
                    37: function left() {
                        $current = self.$node.find('.focused');
                        $prev = $current.prev().addClass('focused');
                        if($prev.length > 0) {
                            $current.removeClass('focused');
                        }
                    },
                    38: function up() {
                        $current = self.$node.find('.focused');
                        $prevRow = $current.parent().prev();
                        if($prevRow.length > 0) {
                            $prev = jQuery($prevRow.children()[$current.index()]).addClass('focused');
                            if($prev.length > 0) {
                                $current.removeClass('focused');
                            }
                        }
                    },
                    39: function right() {
                        $current = self.$node.find('.focused');
                        $next = $current.next().addClass('focused');
                        if($next.length > 0) {
                            $current.removeClass('focused');
                        }
                    },
                    40: function down() {
                        $current = self.$node.find('.focused');
                        $nextRow = $current.parent().next();
                        if($nextRow.length > 0) {
                            $next = jQuery($nextRow.children()[$current.index()]).addClass('focused');
                            if($next.length > 0) {
                                $current.removeClass('focused');
                            }
                        }
                    }
                };
                jQuery(document).keydown(function(e) {
                    e.stopPropagation( );
                    var isOverlayVisible = self.$node.css('display') === 'table';
                    if(isOverlayVisible) {
                        // check if there is a move-command for the pressed key
                        var moveCommand = movements[e.keyCode];
                        if(moveCommand) {
                            moveCommand();
                            return false;
                        }
                    }
                });
            },
            _initEvents: function() {
                var self = this;
                // when the editable is deactivated, hide the layer
                Aloha.bind('aloha-editable-deactivated', function(event, rangeObject) {
                    self.$node.hide();
                });
            },
            _createColorButtons: function($node, colors, onSelectCallback) {
                var self = this;
                function mkButton(colorCode) {
                    return jQuery("<td style='BACKGROUND-COLOR: "+colorCode+"; cursor: pointer'><div style='height: 15px; width: 15px'></div></td>")
                        .mouseover(function() {
                            jQuery(this).addClass('mouseover');
                        })
                        .mouseout(function() {
                            jQuery(this).removeClass('mouseover');
                        })
                        .click(function(e) {
                            self.$node.hide();
                            onSelectCallback(colorCode,self.$colorArg);
                            return false;
                        });
                }
                function addRow() {
                    return jQuery('<tr></tr>').appendTo(self.$tbody);
                }
                var colorList = jQuery.grep(
                    colors.split(' '),
                    function filterOutEmptyOnces(e) {
                        return e != '';
                    }
                );
                var i=0, colorCode;
                var $row;
                while(colorCode = colorList[i]) {
                    // make a new row every 10 colors
                    if(((i%7)===0)) {
                        $row = addRow();
                    }
                    mkButton(colorCode).appendTo($row);
                    i++;
                }
            }
        };

        return Plugin.create('colorselector', {
            _constructor: function(){
                this._super('colorselector');
            },
            languages: ['en'],
            init: function() {
                var self = this;
                if (!Aloha.settings.plugins.colorselector) {
                    Aloha.settings.plugins.colorselector = {}
                }
                self.settings = Aloha.settings.plugins.colorselector || {};
                if(!self.settings.colors) {
                    self.settings.colors = '#FFFFFF #CCCCCC #COCOCO #999999 #666666 #333333 #000000 ' + 
                                           '#FFCCCC #FF6666 #FF0000 #CC0000 #990000 #660000 #330000 ' +
                                           '#FFCC99 #FF9966 #FF9900 #FF6600 #CC6600 #993300 #663300 ' +
                                           '#FFFF99 #FFFF66 #FFCC66 #FFCC33 #CC9933 #996633 #663333 ' +
                                           '#FFFFCC #FFFF33 #FFFF00 #FFCC00 #999900 #666600 #333300 ' +
                                           '#99FF99 #66FF99 #33FF33 #33CC00 #009900 #006600 #003300 ' +
                                           '#99FFFF #33FFFF #66CCCC #00CCCC #339999 #336666 #003333 ' +
                                           '#CCFFFF #66FFFF #33CCFF #3366FF #3333FF #000099 #000066 ' +
                                           '#CCCCFF #9999FF #6666CC #6633FF #6600CC #333399 #330099 ' +
                                           '#FFCCFF #FF99FF #CC66CC #CC33CC #993399 #663366 #330033'
                }
                var insertButton = new Aloha.ui.Button({
                    'name': 'colorselector',
                    'iconClass': 'aloha-button-colorselector',
                    'size': 'small',
                    'onclick': function(element, event) { self.colorselector.show(element.btnEl.dom, "highlight"); },
                    'tooltip': i18n.t('button.colorselector.tooltip'),
                    'toggle': false
                });
                var insertButtonFC = new Aloha.ui.Button({
                    'name': 'fontcolorselector',
                    'iconClass': 'aloha-button-fontcolorselector',
                    'size': 'small',
                    'onclick': function(element, event) { self.colorselector.show(element.btnEl.dom, "color"); },
                    'tooltip': i18n.t('button.fontcolorselector.tooltip'),
                    'toggle': false
                });
                FloatingMenu.addButton(
                    'Aloha.continuoustext',
                    insertButton,
                    i18nCore.t('floatingmenu.tab.format'),
                    1
                );
                FloatingMenu.addButton(
                    'Aloha.continuoustext',
                    insertButtonFC,
                    i18nCore.t('floatingmenu.tab.format'),
                    1
                );
                self.colorselector = new Colorselector(self.settings.colors, self.onColorSelect);
            },
            /**
             * insert a colorspan after selecting it from the list
            */
            onColorSelect: function(colorCode, colorArg) {
                var self = this;
                var tagToUse = "span";
                var classToUse = "class=aloha";
                var cssTag;
                if (colorArg == "color") {
                  cssTag = 'COLOR';
                } else {
                  cssTag = 'BACKGROUND-COLOR';
                }
                var styleToUse = "style='" + cssTag + ": " + colorCode + "'";

                var markup = jQuery('<' + tagToUse + ' ' + classToUse + ' ' + styleToUse + '></' + tagToUse + '>'), rangeObject = Aloha.Selection.rangeObject, selectedCells = jQuery('.aloha-cell-selected');

                // formating workaround for table plugin
                if (selectedCells.length > 0) {
                    var cellMarkupCounter = 0;
                    selectedCells.each(function () {
                        var cellContent = jQuery(this).find('div'), cellMarkup = cellContent.find(tagToUse);

                        if (cellMarkup.length > 0) {
                            // unwrap all found markup text
                            // <td><b>text</b> foo <b>bar</b></td>
                            // and wrap the whole contents of the <td> into <b> tags
                            // <td><b>text foo bar</b></td>
                            cellMarkup.contents().unwrap();
                            cellMarkupCounter++;
                        }
                        cellContent.contents().wrap('<' + tagToUse + ' ' + classToUse + ' ' + styleToUse + '></' + tagToUse + '>');
                    });

                    // remove all markup if all cells have markup
                    if (cellMarkupCounter == selectedCells.length) {
                        selectedCells.find(tagToUse).contents().unwrap();
                    }
                    return false;
                }

                var parents = rangeObject.getSelectionTree();
                var count = 0;
                var partialreplace = false;
                // Loop through all matching markup sections and apply the new CSS
                for (var i = 0; i < parents.length; i++) {
                  if (parents[i].selection.toLowerCase() == "full") {
                    count = 0;
                    jQuery(parents[i].domobj).find('span').each(function () {
                      count += 1;
                      jQuery(this).css(cssTag.toLowerCase(),colorCode);
                    });
                    if (count == 0 && parents.length == 1) {
                      // Maybe we just selected the actual element, so check it's parent
                      jQuery(parents[i].domobj).parent().each(function() { 
                        if (this.nodeName.toLowerCase() == 'span') {
                          count += 1;
                          jQuery(this).css(cssTag.toLowerCase(),colorCode);
                        };
                      });
                    }
                    if (count == 0 || (parents[i].domobj.tagName && parents[i].domobj.tagName.toLowerCase() != 'span')) {
                      if (parents[i].domobj.nodeType == 3)
                        jQuery(parents[i].domobj).wrap(markup);
                      else
                        jQuery(parents[i].domobj).wrapInner(markup);
                    }
                  }
                  else if (parents[i].selection.toLowerCase() == "partial") {
                    partialreplace = true;
                    replacechild(parents[i],tagToUse,classToUse,styleToUse,cssTag,colorCode);
                  }
                };

                // Trigger undo point!
                Aloha.activeEditable.smartContentChange( { type : 'blur' }, null );

                // Throws errors if we've added a tag in the middle, so skip it
                // instead of having it error
                if (! partialreplace)
                  rangeObject.select();
                return false;
            }
        });
        function replacechild(item,tagToUse,classToUse,styleToUse,cssTag,colorCode) {
          if (item.domobj.nodeType == 3) {
            var text = item.domobj.data.substr(item.startOffset, item.endOffset - item.startOffset);
            text = '<' + tagToUse + ' ' + classToUse + ' ' + styleToUse + '>' + text + '</' + tagToUse + '>';
            text = item.domobj.data.substr(0,item.startOffset) + text;
            text = text + item.domobj.data.substr(item.endOffset, item.domobj.data.length - item.endOffset);
            jQuery(item.domobj).replaceWith(text);
          }
          else if (item.domobj.tagName.toLowerCase() == tagToUse.toLowerCase() && item.selection == "full") {
            jQuery(item.domobj).css(cssTag.toLowerCase(),colorCode);
            jQuery(item.domobj).find('span').each(function () {
              jQuery(this).css(cssTag.toLowerCase(),colorCode);
            });
          }
          else {
            for (var j = 0; j < item.children.length; j++) {
              if (item.children[j].selection == "partial" || item.children[j].selection == "full")
                replacechild(item.children[j],tagToUse,classToUse,styleToUse,cssTag,colorCode);
            };
          }
        }


});
