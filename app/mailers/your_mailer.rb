class YourMailer < ActionMailer::Base
  def feedback
    mail :subject => "GFW Feedback",
         :to      => "adrian@simbiotica.es",
         :from    => "adrian@simbiotica.es",
         :body    => "test"
  end
end
