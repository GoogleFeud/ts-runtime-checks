(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[405],{7497:function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isInCache=t.createBlock=void 0,t.createBlock=function(e){return{nodes:[],cache:new Set,parent:e}},t.isInCache=function(e,t){let r=t;for(;r;){if(r.cache.has(e))return!0;r=r.parent}return!1}},3349:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var a=Object.getOwnPropertyDescriptor(t,r);a&&!("get"in a?!t.__esModule:a.writable||a.configurable)||(a={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,a)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),a=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0});const o=r(249);t.default=e=>t=>{const r=new o.Transformer(e,t);return e=>r.run(e)},a(r(9814),t)},9814:function(e,t,r){"use strict";var n=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.Functions=t.Markers=void 0;const a=n(r(4625)),o=r(7914),i=r(3826),s=r(7914);function c(e,t,r){if(a.default.isIdentifier(e))return t(e,r);if(a.default.isObjectBindingPattern(e)){const r=[];for(const n of e.elements)r.push(...c(n.name,t,0));return r}if(a.default.isArrayBindingPattern(e)){const r=[];for(const n of e.elements)a.default.isOmittedExpression(n)||r.push(...c(n.name,t,1));return r}return t(e)}t.Markers={Assert:(e,{ctx:t,exp:r,block:n,parameters:o,optional:u})=>{if(1!==t){let t=r;if(!a.default.isIdentifier(t)&&!a.default.isPropertyAccessExpression(t)&&!a.default.isElementAccessExpression(t)){const[e,r]=(0,s.genIdentifier)("temp",t,a.default.NodeFlags.Const);n.nodes.push(e),t=r}return n.nodes.push(...(0,i.validate)(o[0],t,new i.ValidationContext({errorTypeName:o[1]?.symbol?.name,transformer:e,depth:[],propName:-1===t.pos?"value":t.getText()}))),t}n.nodes.push(...c(r,((t,r)=>(0,i.validate)(void 0!==r?e.checker.getTypeAtLocation(t):o[0],t,new i.ValidationContext({errorTypeName:o[1]?.symbol?.name,transformer:e,depth:[],propName:a.default.isIdentifier(t)?t.text:t}),u))))},EarlyReturn:(e,{ctx:t,exp:r,block:n,parameters:u,optional:l})=>{const f=u[1]?(0,o.isErrorMessage)(u[1])?{returnErr:!0}:{return:e.typeValueToNode(u[1],!0)}:{return:s.UNDEFINED};if(1!==t){let t=r;if(!a.default.isIdentifier(t)&&!a.default.isPropertyAccessExpression(t)&&!a.default.isElementAccessExpression(t)){const[e,r]=(0,s.genIdentifier)("temp",t,a.default.NodeFlags.Const);n.nodes.push(e),t=r}return n.nodes.push(...(0,i.validate)(u[0],t,new i.ValidationContext({resultType:f,transformer:e,depth:[],propName:-1===t.pos?"value":t.getText()}))),t}n.nodes.push(...c(r,((t,r)=>(0,i.validate)(void 0!==r?e.checker.getTypeAtLocation(t):u[0],t,new i.ValidationContext({resultType:f,transformer:e,depth:[],propName:a.default.isIdentifier(t)?t.text:t}),l))))}},t.Functions={is:(e,t)=>{let r=t.call.arguments[0];if(!a.default.isIdentifier(r)){const[e,n]=(0,s.genIdentifier)("temp",r,a.default.NodeFlags.Const);r=n,t.block.nodes.push(e)}t.block.nodes.push(...(0,i.validate)(t.type,r,new i.ValidationContext({resultType:{return:a.default.factory.createFalse()},transformer:e,depth:[],propName:-1===r.pos?"value":r.getText()})),a.default.factory.createReturnStatement(a.default.factory.createTrue()))},check:(e,t)=>{let r=t.call.arguments[0];if(!a.default.isIdentifier(r)){const[e,n]=(0,s.genIdentifier)("temp",r,a.default.NodeFlags.Const);r=n,t.block.nodes.push(e)}const[n,c]=(0,s.genIdentifier)("result",a.default.factory.createArrayLiteralExpression(),a.default.NodeFlags.Const);t.block.nodes.push(n),t.block.nodes.push(...(0,i.validate)(t.type,r,new i.ValidationContext({resultType:{custom:e=>a.default.factory.createExpressionStatement((0,o.genArrayPush)(c,e))},transformer:e,depth:[],propName:-1===r.pos?"value":r.getText()})),a.default.factory.createReturnStatement(a.default.factory.createArrayLiteralExpression([r,c])))}}},249:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var a=Object.getOwnPropertyDescriptor(t,r);a&&!("get"in a?!t.__esModule:a.writable||a.configurable)||(a={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,a)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),a=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),o=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return a(t,e),t},i=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.Transformer=void 0;const s=i(r(4625)),c=o(r(7497)),u=r(9814),l=r(7914),f=r(7914);t.Transformer=class{constructor(e,t){this.checker=e.getTypeChecker(),this.ctx=t}run(e){if(e.isDeclarationFile)return e;const t=this.visitEach(e.statements);return s.default.factory.updateSourceFile(e,t)}visitEach(e,t=c.createBlock()){for(const r of e){const e=this.visitor(r,t);e&&(Array.isArray(e)?t.nodes.push(...e):t.nodes.push(e))}return t.nodes}visitor(e,t){if(s.default.isFunctionExpression(e)||s.default.isFunctionDeclaration(e)||s.default.isArrowFunction(e)){if(!e.body)return e;const r=c.createBlock(t);for(const t of e.parameters)this.callMarkerFromParameterDecl(t,r);if(s.default.isBlock(e.body))this.visitEach(e.body.statements,r);else{const t=s.default.visitNode(e.body,(e=>this.visitor(e,r)));r.nodes.push(s.default.factory.createReturnStatement(t))}return s.default.isFunctionDeclaration(e)?s.default.factory.createFunctionDeclaration(e.decorators,e.modifiers,e.asteriskToken,e.name,e.typeParameters,e.parameters,e.type,s.default.factory.createBlock(r.nodes,!0)):s.default.isArrowFunction(e)?s.default.factory.createArrowFunction(e.modifiers,e.typeParameters,e.parameters,e.type,e.equalsGreaterThanToken,s.default.factory.createBlock(r.nodes,!0)):s.default.factory.createFunctionExpression(e.modifiers,e.asteriskToken,e.name,e.typeParameters,e.parameters,e.type,s.default.factory.createBlock(r.nodes,!0))}if(s.default.isAsExpression(e)){let r=(0,l.resolveAsChain)(e);const n=this.checker.getSymbolAtLocation(r);if(n){if(c.isInCache(n,t))return e;t.cache.add(n)}r=s.default.visitEachChild(r,(e=>this.visitor(e,t)),this.ctx);const a=this.callMarkerFromAsExpression(e,r,t);return s.default.isExpressionStatement(e.parent)?void 0:a}if(s.default.isBlock(e))return s.default.factory.createBlock(this.visitEach(e.statements,c.createBlock(t)));if(s.default.isCallExpression(e)&&e.arguments[0]){const t=e.expression,r=this.checker.getTypeAtLocation(t).getCallSignatures()[0]?.getTypeParameters();if(r&&r[0]&&r[1]){const t=r[1].getDefault()?.getProperty("__marker");if(t&&t.valueDeclaration){const r=this.checker.getTypeOfSymbolAtLocation(t,t.valueDeclaration);if(r.isStringLiteral()){const t=c.createBlock();return u.Functions[r.value](this,{call:e,block:t,type:e.typeArguments?.map((e=>this.checker.getTypeAtLocation(e)))[0]||this.checker.getNullType()}),s.default.factory.createImmediatelyInvokedArrowFunction(t.nodes)}}}}return s.default.visitEachChild(e,(e=>this.visitor(e,t)),this.ctx)}callMarkerFromParameterDecl(e,t){if(!e.type||!s.default.isTypeReferenceNode(e.type))return;const r=this.resolveActualType(this.checker.getTypeAtLocation(e.type));r&&r.aliasSymbol&&u.Markers[r.aliasSymbol.name]&&u.Markers[r.aliasSymbol.name](this,{block:t,parameters:r.aliasTypeArguments||e.type.typeArguments?.map((e=>this.checker.getTypeAtLocation(e)))||[],ctx:1,exp:e.name,optional:Boolean(e.questionToken)})}callMarkerFromAsExpression(e,t,r){if(!s.default.isTypeReferenceNode(e.type))return e;const n=this.resolveActualType(this.checker.getTypeAtLocation(e.type));return n&&n.aliasSymbol&&u.Markers[n.aliasSymbol.name]&&u.Markers[n.aliasSymbol.name](this,{block:r,parameters:n.aliasTypeArguments||e.type.typeArguments?.map((e=>this.checker.getTypeAtLocation(e)))||[],ctx:0,exp:t})||e}resolveActualType(e){const t=e.getProperty("__marker");if(t&&t.valueDeclaration)return this.checker.getNonNullableType(this.checker.getTypeOfSymbolAtLocation(t,t.valueDeclaration))}getUtilityType(e){const t=e.getProperty("__utility");if(t&&t.valueDeclaration)return this.checker.getNonNullableType(this.checker.getTypeOfSymbolAtLocation(t,t.valueDeclaration))}getStringFromType(e,t){const r=e.aliasTypeArguments?.[t];if(r&&r.isStringLiteral())return r.value}getTypeArg(e,t){return e.aliasTypeArguments?.[t]}typeValueToNode(e,t){if(e.isStringLiteral())return s.default.factory.createStringLiteral(e.value);if(e.isNumberLiteral())return s.default.factory.createNumericLiteral(e.value);if((0,l.hasBit)(e,s.default.TypeFlags.BigIntLiteral)){const{value:t}=e;return s.default.factory.createBigIntLiteral(t)}if(e.isUnion()){const r=e.types.map((e=>this.typeValueToNode(e,!0)));return t?r[0]:r}if("false"===e.intrinsicName)return s.default.factory.createFalse();if("true"===e.intrinsicName)return s.default.factory.createTrue();if("null"===e.intrinsicName)return s.default.factory.createNull();{const t=this.getUtilityType(e);if(t&&"Expr"===t.aliasSymbol?.name){const t=this.getStringFromType(e,0);return t?this.stringToNode(t):f.UNDEFINED}return f.UNDEFINED}}stringToNode(e,t){const r=s.default.createSourceFile("expr",e,s.default.ScriptTarget.ESNext,!1,s.default.ScriptKind.JS).statements[0];if(!r||!s.default.isExpressionStatement(r))return f.UNDEFINED;const n=e=>s.default.isIdentifier(e)?t&&t[e.text]?t[e.text]:s.default.factory.createIdentifier(e.text):s.default.visitEachChild(e,n,this.ctx);return s.default.visitNode(r.expression,n)}typeToString(e){if(e.isStringLiteral())return e.value;if(e.isNumberLiteral())return e.value.toString();{const t=this.getUtilityType(e);return t&&"Expr"===t.aliasSymbol?.name&&this.getStringFromType(t,0)||""}}}},7914:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var a=Object.getOwnPropertyDescriptor(t,r);a&&!("get"in a?!t.__esModule:a.writable||a.configurable)||(a={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,a)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),a=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),o=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return a(t,e),t};Object.defineProperty(t,"__esModule",{value:!0}),t.UNDEFINED=t.genArrayPush=t.genNegate=t.genIdentifier=t.genStmt=t.genNum=t.genStr=t.genAdd=t.genNot=t.genForInLoop=t.genForLoop=t.genPropAccess=t.genInstanceof=t.genNew=t.genThrow=t.genLogicalAND=t.genLogicalOR=t.genBinaryChain=t.genTypeCmp=t.genCmp=t.genIfElseChain=t.genIf=t.resolveAsChain=t.isErrorMessage=t.isTrueType=t.hasBit=void 0;const i=o(r(4625));function s(e,t,r){if(!(e>=t.length))return i.factory.createIfStatement(t[e][0],l(t[e][1]),s(e+1,t,r)||r)}function c(e,t){if(1===t.length)return t[0];let r=i.factory.createBinaryExpression(t[0],e,t[1]);for(let n=2;n<t.length;n++)r=i.factory.createBinaryExpression(r,e,t[n]);return r}function u(e){return i.factory.createPrefixUnaryExpression(i.default.SyntaxKind.ExclamationToken,e)}function l(e){return Array.isArray(e)?i.factory.createBlock(e.map(l),!0):e.kind>i.default.SyntaxKind.EmptyStatement&&e.kind<i.default.SyntaxKind.DebuggerStatement?e:i.factory.createExpressionStatement(e)}function f(e,t,r=i.default.NodeFlags.Let){const n="string"===typeof e?i.factory.createUniqueName(e):e;return[i.factory.createVariableStatement(void 0,i.factory.createVariableDeclarationList([i.factory.createVariableDeclaration(n,void 0,void 0,t)],r)),n]}t.hasBit=function(e,t){return 0!==(e.flags&t)},t.isTrueType=function(e){return!!e&&"true"===e.intrinsicName},t.isErrorMessage=function(e){return Boolean(e.getProperty("__error_msg"))},t.resolveAsChain=function(e){for(;i.default.isAsExpression(e);)e=e.expression;return e},t.genIf=function(e,t,r){return i.factory.createIfStatement(e,l(t),r&&l(r))},t.genIfElseChain=function(e,t){return s(0,e,t?l(t):void 0)},t.genCmp=function(e,t,r=!0){return i.factory.createBinaryExpression(e,r?i.default.SyntaxKind.ExclamationEqualsEqualsToken:i.default.SyntaxKind.EqualsEqualsEqualsToken,t)},t.genTypeCmp=function(e,t,r=!0){return i.factory.createBinaryExpression(i.factory.createTypeOfExpression(e),r?i.default.SyntaxKind.ExclamationEqualsEqualsToken:i.default.SyntaxKind.EqualsEqualsEqualsToken,i.factory.createStringLiteral(t))},t.genBinaryChain=c,t.genLogicalOR=function(...e){return c(i.default.SyntaxKind.BarBarToken,e)},t.genLogicalAND=function(...e){return c(i.default.SyntaxKind.AmpersandAmpersandToken,e)},t.genThrow=function(e){return i.factory.createThrowStatement(e)},t.genNew=function(e,t){return i.factory.createNewExpression(i.factory.createIdentifier(e),void 0,"string"===typeof t?[i.factory.createStringLiteral(t)]:t)},t.genInstanceof=function(e,t){return i.factory.createBinaryExpression(e,i.default.SyntaxKind.InstanceOfKeyword,"string"===typeof t?i.factory.createIdentifier(t):t)},t.genPropAccess=function(e,t){return"string"===typeof t?i.factory.createPropertyAccessExpression(e,t):i.factory.createElementAccessExpression(e,t)},t.genForLoop=function(e,t,r){const[n,a]=f(t,i.factory.createNumericLiteral(0));return[i.factory.createForStatement(n.declarationList,i.factory.createBinaryExpression(a,i.default.SyntaxKind.LessThanToken,i.factory.createPropertyAccessExpression(e,"length")),i.factory.createPostfixIncrement(a),l(r)),a]},t.genForInLoop=function(e,t,r){const[n,a]=f(t);return[i.factory.createForInStatement(n.declarationList,e,l(r)),a]},t.genNot=u,t.genAdd=function(e,t){return i.factory.createAdd(e,t)},t.genStr=function(e){return i.factory.createStringLiteral(e)},t.genNum=function(e){return i.factory.createNumericLiteral(e)},t.genStmt=l,t.genIdentifier=f,t.genNegate=function(e){if(i.default.isBinaryExpression(e))switch(e.operatorToken.kind){case i.default.SyntaxKind.EqualsEqualsToken:return i.factory.createBinaryExpression(e.left,i.default.SyntaxKind.ExclamationEqualsToken,e.right);case i.default.SyntaxKind.ExclamationEqualsToken:return i.factory.createBinaryExpression(e.left,i.default.SyntaxKind.EqualsEqualsToken,e.right);case i.default.SyntaxKind.EqualsEqualsEqualsToken:return i.factory.createBinaryExpression(e.left,i.default.SyntaxKind.ExclamationEqualsEqualsToken,e.right);case i.default.SyntaxKind.ExclamationEqualsEqualsToken:return i.factory.createBinaryExpression(e.left,i.default.SyntaxKind.EqualsEqualsEqualsToken,e.right);case i.default.SyntaxKind.GreaterThanToken:return i.factory.createBinaryExpression(e.left,i.default.SyntaxKind.LessThanToken,e.right);case i.default.SyntaxKind.GreaterThanEqualsToken:return i.factory.createBinaryExpression(e.left,i.default.SyntaxKind.LessThanEqualsToken,e.right);case i.default.SyntaxKind.LessThanToken:return i.factory.createBinaryExpression(e.left,i.default.SyntaxKind.GreaterThanToken,e.right);case i.default.SyntaxKind.LessThanEqualsToken:return i.factory.createBinaryExpression(e.left,i.default.SyntaxKind.GreaterThanEqualsToken,e.right)}else if(i.default.isPrefixUnaryExpression(e)&&e.operator===i.default.SyntaxKind.ExclamationToken)return e.operand;return u(e)},t.genArrayPush=function(e,t){return i.factory.createCallExpression(i.factory.createPropertyAccessExpression(e,i.factory.createIdentifier("push")),void 0,[t])},t.UNDEFINED=i.factory.createIdentifier("undefined")},1472:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var a=Object.getOwnPropertyDescriptor(t,r);a&&!("get"in a?!t.__esModule:a.writable||a.configurable)||(a={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,a)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),a=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),o=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return a(t,e),t};Object.defineProperty(t,"__esModule",{value:!0}),t.ValidationContext=void 0;const i=o(r(4625)),s=r(7914);t.ValidationContext=class{constructor(e){this.transformer=e.transformer,this.errorTypeName=e.errorTypeName||"Error",this.depth=e.depth,this.resultType=e.resultType||{throw:!0},e.propName&&this.depth.push({propName:e.propName})}error(e,t){if(this.resultType.return)return i.factory.createReturnStatement(this.resultType.return);const r=this.visualizeDepth(),n="string"===typeof r?(0,s.genStr)(t?.[0]||"Expected "+r+(t?.[1]||` to be ${this.transformer.checker.typeToString(e)}.`)):(0,s.genAdd)((0,s.genAdd)((0,s.genStr)(t?.[0]||"Expected "),r),(0,s.genStr)(t?.[1]||` to be ${this.transformer.checker.typeToString(e)}.`));return this.resultType.returnErr?i.factory.createReturnStatement(n):this.resultType.custom?this.resultType.custom(n):(0,s.genThrow)((0,s.genNew)(this.errorTypeName,[n]))}addPath(e,t,r){this.depth.push({parent:e,propName:t,dotNotation:r})}removePath(){this.depth.pop()}genOptional(e,t){return(0,s.genLogicalAND)(this.exists(e),t)}exists(e){const t=this.depth[this.depth.length-1];return t.parent&&"string"===typeof t.propName?i.factory.createBinaryExpression((0,s.genStr)(t.propName),i.default.SyntaxKind.InKeyword,t.parent):(0,s.genCmp)(e,s.UNDEFINED)}visualizeDepth(){const e=[];let t;for(const r of this.depth)"string"===typeof r.propName?e.push(r.propName):r.dotNotation?t?e.length?(t=(0,s.genAdd)((0,s.genAdd)(t,(0,s.genStr)(`${e.join(".")}.`)),r.propName),e.length=0):t=(0,s.genAdd)((0,s.genAdd)(t,(0,s.genStr)(".")),r.propName):e.length?(t=(0,s.genAdd)((0,s.genStr)(`${e.join(".")}.`),r.propName),e.length=0):t=r.propName:t?e.length?(t=(0,s.genAdd)((0,s.genAdd)(t,(0,s.genStr)(`]${e.join(".")}[`)),r.propName),e.length=0):t=(0,s.genAdd)((0,s.genAdd)(t,(0,s.genStr)("][")),r.propName):e.length?(t=(0,s.genAdd)((0,s.genStr)(`${e.join(".")}[`),r.propName),e.length=0):t=r.propName;return t?this.depth[this.depth.length-1]?.dotNotation?e.length?(0,s.genAdd)(t,(0,s.genStr)(e.join("."))):t:e.length?(0,s.genAdd)(t,(0,s.genStr)(`].${e.join(".")}`)):(0,s.genAdd)(t,(0,s.genStr)("]")):e.join(".")}}},3826:function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r);var a=Object.getOwnPropertyDescriptor(t,r);a&&!("get"in a?!t.__esModule:a.writable||a.configurable)||(a={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,a)}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),a=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),o=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&n(t,e,r);return a(t,e),t};Object.defineProperty(t,"__esModule",{value:!0}),t.ValidationContext=t.isNoCheck=t.isTupleType=t.isArrayType=t.validate=t.validateType=t.validateBaseType=void 0;const i=o(r(4625)),s=r(7914),c=r(7914),u=r(1472);Object.defineProperty(t,"ValidationContext",{enumerable:!0,get:function(){return u.ValidationContext}});const l=Symbol("NoCheck");function f(e,t,r){if(t.isStringLiteral())return[(0,s.genCmp)(r,i.factory.createStringLiteral(t.value))];if(t.isNumberLiteral())return[(0,s.genCmp)(r,i.factory.createNumericLiteral(t.value))];if((0,c.hasBit)(t,i.TypeFlags.String))return[(0,s.genTypeCmp)(r,"string")];if((0,c.hasBit)(t,i.TypeFlags.BigInt))return[(0,s.genTypeCmp)(r,"bigint")];if((0,c.hasBit)(t,i.TypeFlags.Number))return[(0,s.genTypeCmp)(r,"number")];if((0,c.hasBit)(t,i.TypeFlags.Boolean))return[(0,s.genTypeCmp)(r,"boolean")];if((0,c.hasBit)(t,i.TypeFlags.ESSymbol))return[(0,s.genTypeCmp)(r,"symbol")];if((0,c.hasBit)(t,i.TypeFlags.Null))return[(0,s.genCmp)(r,i.factory.createNull())];if((0,c.hasBit)(t,i.TypeFlags.Any)||(0,c.hasBit)(t,i.TypeFlags.Unknown))return l;if(1===t.getCallSignatures().length)return[(0,s.genTypeCmp)(r,"function")];if(t.isClass())return[(0,s.genNot)((0,s.genInstanceof)(r,t.symbol.name)),` to be an instance of ${t.symbol?.name}.`];{const n=e.transformer.getUtilityType(t);if(!n||!n.aliasSymbol||!n.aliasTypeArguments)return;switch(n.aliasSymbol.name){case"NumRange":{const t=e.transformer.getTypeArg(n,0),a=e.transformer.getTypeArg(n,1),o=[];if(t&&t.isNumberLiteral()&&o.push(i.factory.createLessThan(r,e.transformer.typeValueToNode(t,!0))),a&&a.isNumberLiteral()&&o.push(i.factory.createGreaterThan(r,e.transformer.typeValueToNode(a))),!o.length)return[(0,s.genTypeCmp)(r,"number")];let c="";if(t){const r=e.transformer.typeToString(t);r&&(c+=`more than ${r}`)}if(a){const t=e.transformer.typeToString(a);t&&(c.length&&(c+=" and "),c+=`less than ${t}`)}return[(0,s.genLogicalOR)((0,s.genTypeCmp)(r,"number"),(0,s.genLogicalOR)(...o)),` to be ${c}.`]}case"Matches":{const t=e.transformer.getTypeArg(n,0);if(!t||!t.isStringLiteral())return[(0,s.genTypeCmp)(r,"string")," to be string."];const a=e.transformer.typeValueToNode(t,!0);return[(0,s.genLogicalOR)((0,s.genTypeCmp)(r,"string"),(0,s.genNot)(i.factory.createCallExpression((0,s.genPropAccess)(i.default.isStringLiteral(a)?i.factory.createRegularExpressionLiteral(a.text):a,"test"),void 0,[r]))),` to match "${e.transformer.typeToString(t)}".`]}case"NoCheck":return l}}}function p(e,t,r){let n;const a=f(r,e,t);if(a){if(a===l)return;return{condition:()=>a[0],error:()=>r.error(e,[void 0,a[1]])}}if(e.isUnion())return{condition:()=>{let n,a=!1;const o=[];for(const u of e.types)if((0,c.hasBit)(u,i.TypeFlags.Undefined))n=!0;else if(g(r.transformer.checker,u)||y(r.transformer.checker,u)){if(a)continue;o.push((0,s.genNot)((0,s.genInstanceof)(t,"Array"))),a=!0}else{const e=p(u,t,r);e&&o.push(e.condition())}return n?r.genOptional(t,(0,s.genLogicalAND)(...o)):(0,s.genLogicalAND)(...o)},error:()=>r.error(e)};if(n=y(r.transformer.checker,e))return{condition:()=>(0,s.genNot)((0,s.genInstanceof)(t,"Array")),error:()=>r.error(e),other:_(r,n)?void 0:()=>{const e=i.factory.createUniqueName("i"),[a,o]=(0,s.genIdentifier)("x",i.factory.createElementAccessExpression(t,e),i.default.NodeFlags.Const);r.addPath(o,e);const c=d(n,o,r);return r.removePath(),[(0,s.genForLoop)(t,e,[a,...c])[0]]}};if(n=g(r.transformer.checker,e))return{condition:()=>(0,s.genNot)((0,s.genInstanceof)(t,"Array")),error:()=>r.error(e),other:()=>{const e=[],a=n;for(let n=0;n<a.length;n++){const o=i.factory.createElementAccessExpression(t,n);r.addPath(o,i.factory.createNumericLiteral(n)),a[n]!==a[n].getNonNullableType()?e.push(...d(a[n].getNonNullableType(),o,r,!0)):e.push(...d(a[n],o,r,!1)),r.removePath()}return e}};{const n=r.transformer.getUtilityType(e);switch(n?.aliasSymbol?.name){case"ExactProps":{const e=r.transformer.getTypeArg(n,0);if(!e)return;if(r.exactProps)return p(e,t,r);r.exactProps=!0;const a=p(e,t,r);if(!a)return;return{...a,other:()=>{const e=a.other();return r.exactProps=!1,e}}}case"If":{if(!n.aliasTypeArguments)return;const e=n.aliasTypeArguments[0],a=r.transformer.getStringFromType(n,1),o=(0,c.isTrueType)(n.aliasTypeArguments[2]);if(!e||!a)return;const i=o?p(e,t,r):void 0,u=()=>(0,s.genNegate)(r.transformer.stringToNode(a,{$self:t})),l=()=>r.error(n,[void 0,` to satisfy \`${a}\`.`]);return{condition:i?i.condition:u,error:i?i.error:l,other:i?()=>i.other?[...i.other(),(0,s.genIf)(u(),l())]:[(0,s.genIf)(u(),l())]:void 0}}default:{const n=r.exactProps;return{other:()=>{const a=e.getProperties(),o=[];if(n){const n=i.factory.createUniqueName("name");r.addPath(t,n,!0);const c=r.error(e,["Property "," is excessive."]);r.removePath(),o.push((0,s.genForInLoop)(t,n,[(0,s.genIf)((0,s.genLogicalAND)(...a.map((e=>(0,s.genCmp)(n,(0,s.genStr)(e.name))))),c)])[0])}for(const n of a){if(n===e.aliasSymbol)continue;const a=i.factory.createElementAccessExpression(t,(0,s.genStr)(n.name));r.addPath(t,n.name);const c=r.transformer.checker.getTypeOfSymbol(n)||r.transformer.checker.getNullType();c===c.getNonNullableType()?o.push(...d(c,a,r,!1)):o.push(...d(c.getNonNullableType(),a,r,!0)),r.removePath()}return o},condition:()=>(0,s.genTypeCmp)(t,"object"),error:()=>r.error(e)}}}}}function d(e,t,r,n){const a=p(e,t,r);if(!a)return[];const{condition:o,error:i,other:c}=a;if(n)return c?[(0,s.genIf)(r.exists(t),[(0,s.genIf)(o(),i()),...c()])]:[(0,s.genIf)(r.genOptional(t,o()),i())];{const e=[(0,s.genIf)(o(),i())];return c&&e.push(...c()),e}}function y(e,t){const r=e.typeToTypeNode(t,void 0,void 0);if(r)return r.kind===i.default.SyntaxKind.ArrayType?e.getTypeArguments(t)[0]:void 0}function g(e,t){const r=e.typeToTypeNode(t,void 0,void 0);if(r)return r.kind===i.default.SyntaxKind.TupleType?e.getTypeArguments(t):void 0}function _(e,t){const r=e.transformer.getUtilityType(t);return!(!r||!r.aliasSymbol||"NoCheck"!==r.aliasSymbol.name)}t.validateBaseType=f,t.validateType=p,t.validate=d,t.isArrayType=y,t.isTupleType=g,t.isNoCheck=_},3841:function(e){function t(e){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=function(){return[]},t.resolve=t,t.id=3841,e.exports=t},5301:function(e,t,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/",function(){return r(2412)}])},1115:function(e,t,r){"use strict";r.d(t,{y:function(){return u}});var n=r(4051),a=r.n(n),o=r(5893),i=r(9604),s=r(7294);function c(e,t,r,n,a,o,i){try{var s=e[o](i),c=s.value}catch(u){return void r(u)}s.done?t(c):Promise.resolve(c).then(n,a)}function u(e){var t=(0,s.useState)(),r=t[0],n=t[1],u=(0,i.Ik)();return(0,s.useEffect)((function(){var t;u&&(t=a().mark((function t(){var r;return a().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,u.editor.colorize(e.text,"javascript",{tabSize:4});case 2:r=t.sent,n(r);case 4:case"end":return t.stop()}}),t)})),function(){var e=this,r=arguments;return new Promise((function(n,a){var o=t.apply(e,r);function i(e){c(o,n,a,i,s,"next",e)}function s(e){c(o,n,a,i,s,"throw",e)}i(void 0)}))})()}),[u,e.text]),(0,o.jsx)("div",{children:r&&(0,o.jsx)("div",{dangerouslySetInnerHTML:{__html:r},style:{backgroundColor:"#1e1e1e",overflowY:"auto",paddingLeft:"15px",height:"calc(80vh - 50px)",fontFamily:"monospace",overflowX:"hidden"}})})}},1682:function(__unused_webpack_module,__webpack_exports__,__webpack_require__){"use strict";__webpack_require__.d(__webpack_exports__,{e:function(){return Runnable}});var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__(5893),react_split_pane__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__(5884),_Highlight__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__(1115),_css_App_module_css__WEBPACK_IMPORTED_MODULE_4__=__webpack_require__(8836),_css_App_module_css__WEBPACK_IMPORTED_MODULE_4___default=__webpack_require__.n(_css_App_module_css__WEBPACK_IMPORTED_MODULE_4__),react__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__(7294);function Runnable(props){var ref=(0,react__WEBPACK_IMPORTED_MODULE_3__.useState)(),evalRes=ref[0],setEvalRes=ref[1];return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_split_pane__WEBPACK_IMPORTED_MODULE_1__.Z,{split:"horizontal",defaultSize:"70%",primary:"first",children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div",{children:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_Highlight__WEBPACK_IMPORTED_MODULE_2__.y,{text:props.code})}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div",{className:_css_App_module_css__WEBPACK_IMPORTED_MODULE_4___default().runSection,children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button",{className:_css_App_module_css__WEBPACK_IMPORTED_MODULE_4___default().button,onClick:function(){try{setEvalRes(eval(props.code))}catch(err){setEvalRes(err.toString())}},children:"Run"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("br",{}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p",{className:_css_App_module_css__WEBPACK_IMPORTED_MODULE_4___default().runSectionResult,children:evalRes})]})]})}},2412:function(e,t,r){"use strict";r.r(t),r.d(t,{__N_SSG:function(){return v},default:function(){return b}});var n=r(5893),a=r(5423),o=r.n(a),i=r(3349),s=r.n(i);function c(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}var u='\ntype Assert<T, ErrorType = Error> = T & { __marker?: Assert<T, ErrorType> };\ntype EarlyReturn<T, ReturnValue = undefined> = T & { __marker?: EarlyReturn<T, ReturnValue> };\ntype ErrorMsg = { __error_msg: true };\ntype NumRange<min extends number|Expr<"">, max extends number|Expr<"">> = number & { __utility?: NumRange<min, max> }; \ntype NoCheck<T> = T & { __utility?: NoCheck<T> };\ntype Matches<Regex extends string|Expr<"">> = string & { __utility?: Matches<Regex> };\ntype ExactProps<Obj extends object> = Obj & { __utility?: ExactProps<Obj> };\ntype Expr<Expression extends string> = { __utility?: Expr<Expression> };\ntype If<Type, Expression extends string, FullCheck extends boolean = false> = Type & { __utility?: If<Type, Expression, FullCheck> };\ndeclare function is<T, _M = { __is: true }>(prop: unknown) : prop is T;\ndeclare function check<T, _M = { __marker: "check" }>(prop: unknown) : [T, Array<string>];\n\n',l=function(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{},n=Object.keys(r);"function"===typeof Object.getOwnPropertySymbols&&(n=n.concat(Object.getOwnPropertySymbols(r).filter((function(e){return Object.getOwnPropertyDescriptor(r,e).enumerable})))),n.forEach((function(t){c(e,t,r[t])}))}return e}({},o().getDefaultCompilerOptions(),{noImplicitAny:!0,strictNullChecks:!0,target:o().ScriptTarget.ESNext});var f=r(7294),p=r(9604);function d(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function y(e){var t=(0,p.Ik)();return(0,f.useEffect)((function(){if(t){t.languages.typescript.javascriptDefaults.setCompilerOptions(function(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{},n=Object.keys(r);"function"===typeof Object.getOwnPropertySymbols&&(n=n.concat(Object.getOwnPropertySymbols(r).filter((function(e){return Object.getOwnPropertyDescriptor(r,e).enumerable})))),n.forEach((function(t){d(e,t,r[t])}))}return e}({},l));var e="ts:ts-runtime-checks/index.d.ts";t.languages.typescript.javascriptDefaults.addExtraLib(u,e),t.editor.createModel(u,"typescript",t.Uri.parse(e))}}),[t]),(0,n.jsx)(p.ZP,{height:"calc(90vh - 50px)",language:"typescript",theme:"vs-dark",value:e.code,onChange:e.onChange})}var g=r(1682),_=r(5884),h=r(6961),m=r(8836),T=r.n(m),E=(r(1864),"\n// Interactive playground! Write in your code and see it getting transpiled on the left!\ninterface User {\n    name: string,\n    id: number\n}\n\nfunction validate(user: Assert<User>) {\n    // Your code...\n}\n");function x(e){var t=e.transpile,r=(0,f.useState)(E),a=r[0],o=r[1],i=(0,f.useState)(""),s=i[0],c=i[1];return(0,f.useEffect)((function(){var e=Object.fromEntries(new URLSearchParams(window.location.search).entries());if(e.code){var r=(0,h.decompressFromEncodedURIComponent)(e.code);if(!r)return;o(r);var n=t(r),a=n.code,i=n.error;c(a||""+i)}else c(t(E).code)}),[]),(0,n.jsxs)("div",{children:[(0,n.jsxs)("header",{className:T().header,children:[(0,n.jsxs)("div",{style:{display:"flex"},children:[(0,n.jsx)("h2",{children:"Typescript runtime checks"}),(0,n.jsx)("button",{className:T().button,onClick:function(){a&&navigator.permissions.query({name:"clipboard-write"}).then((function(e){"granted"!=e.state&&"prompt"!=e.state||navigator.clipboard.writeText(location.origin+location.pathname+"?code=".concat((0,h.compressToEncodedURIComponent)(a)))}))},children:"Copy Link"})]}),(0,n.jsx)("a",{href:"https://github.com/GoogleFeud/ts-runtime-checks",style:{fontSize:"24px"},children:(0,n.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"28",height:"28",fill:"currentColor",viewBox:"0 0 16 16",children:(0,n.jsx)("path",{d:"M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"})})})]}),(0,n.jsxs)(_.Z,{split:"vertical",defaultSize:"50%",primary:"first",children:[(0,n.jsx)(y,{code:a,onChange:function(e){o(e);var r=t(e||""),n=r.code,a=r.error;c(n||""+a)}}),(0,n.jsx)(g.e,{code:s})]}),(0,n.jsx)("footer",{className:T().footer,children:(0,n.jsxs)("p",{children:["Made with \u2764\ufe0f by ",(0,n.jsx)("a",{href:"https://github.com/GoogleFeud",children:"GoogleFeud"}),"."]})})]})}var v=!0;function b(e){var t=function(e){var t=o().createSourceFile("lib.d.ts",e+u,l.target||o().ScriptTarget.ESNext,!0,o().ScriptKind.TS);return function(e){var r=o().createSourceFile("module.ts",e,l.target||o().ScriptTarget.ESNext,!0),n="",a={getSourceFile:function(e){return e.endsWith(".d.ts")?t:r},getDefaultLibFileName:function(){return"lib.d.ts"},useCaseSensitiveFileNames:function(){return!1},writeFile:function(e,t){return n=t},getCanonicalFileName:function(e){return e},getCurrentDirectory:function(){return""},getNewLine:function(){return"\n"},fileExists:function(){return!0},readFile:function(){return""},directoryExists:function(){return!0},getDirectories:function(){return[]}},i=o().createProgram(["module.ts"],l,a);window.checker=i.getTypeChecker(),window.source=r;try{i.emit(void 0,void 0,void 0,void 0,{before:[s()(i)]})}catch(c){return{error:c}}return{code:n}}}(e.lib);return(0,n.jsx)(x,{transpile:t})}},8836:function(e){e.exports={header:"App_header__3xFa8",footer:"App_footer__qJi0F",button:"App_button__Z9okP",runSection:"App_runSection__ptbmi",runSectionResult:"App_runSectionResult__ZpuvE"}},3411:function(e){function t(e){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=function(){return[]},t.resolve=t,t.id=3411,e.exports=t},7424:function(){},9107:function(){},444:function(){},6170:function(){},1157:function(){},1638:function(){},1206:function(){},2183:function(){},3024:function(){},2715:function(){},3611:function(){},8353:function(){},1210:function(){},1480:function(){}},function(e){e.O(0,[138,21,578,774,888,179],(function(){return t=5301,e(e.s=t);var t}));var t=e.O();_N_E=t}]);