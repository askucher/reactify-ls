require! {
  \react
  \./head.ls
  \./foot.ls
}
module.exports = ->
                .pug.m-t-sm
                  pre.pug.
                    \n<button class="ladda-button ladda-button-demo btn btn-primary"  data-style="zoom-in">Submit</button>
                  pre.pug.
                    \nvar l = $( '.ladda-button-demo' ).ladda();
                          l.click(function(){
                    
                              l.ladda( 'start' );
                    
                              setTimeout(function(){
                                  l.ladda('stop');
                              },2000)
                    
                          });
                                        