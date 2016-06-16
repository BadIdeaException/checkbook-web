# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure(2) do |config|
  # All Vagrant configuration is done here. The most common configuration
  # options are documented and commented below. For a complete reference,
  # please see the online documentation at vagrantup.com.

  # Increase memory to 1GB to avoid npm failing
  config.vm.provider "virtualbox" do |v|
    v.memory = 1024
  end

  # Every Vagrant virtual environment requires a box to build off of.
  config.vm.box = "ubuntu/trusty64"

  # Disable default share of current folder as /vagrant
  config.vm.synced_folder ".", "/vagrant", disabled: true

  # Share project folder as /home/checkbook-web and make this the default folder for new bash shells
  # (This will also make it the working directory when doing vagrant ssh)
  config.vm.synced_folder ".", "/home/checkbook-web"
  config.vm.provision "shell", inline: "echo -e '\n# Make /home/checkbook-web the default folder\ncd /home/checkbook-web' >> /home/vagrant/.bashrc", privileged: false

  # Enable agent forwarding to use the host key when communicating with github
  config.ssh.forward_agent = true

  # Make ports 8080 and 8443 of the vm available as ports 80 and 
  # 443 on the host
  # This will allow to access the server from the host browser
  config.vm.network "forwarded_port", guest: 8080, host: 80
  config.vm.network "forwarded_port", guest: 8443, host: 443

  # Install nodejs v6.x (LTS from Oct 2016)
  # Even though the server runs virtualized in a docker container, 
  # nodejs is still needed to run grunt, npm etc. in the 
  # development environment
  config.vm.provision "shell" do |shell|
    shell.name = "Install node.js"
    shell.inline = "curl -sL https://deb.nodesource.com/setup_6.x | bash - && apt-get install -y nodejs"
  end

  # Install the build-essential package (can't hurt) and the package
  # libfontconfig (dependency of the phantomjs headless browser used
  # for testing)
  config.vm.provision "shell" do |shell|
    shell.name = "Install vm os packages"
    shell.inline = "apt-get update && apt-get install -y build-essential libfontconfig git"
  end

  config.vm.provision "shell" do |shell|
    shell.name = "Install bower and grunt"
    shell.inline = "npm install -g bower grunt-cli"
  end

  config.vm.provision "shell" do |shell|
    shell.name = "Install checkbook dependencies"
    shell.privileged = false
    shell.inline = "cd /home/checkbook-web && npm install && bower install"
  end

  # Automatically run grunt watch when starting the machine
  config.vm.provision "shell", run: "always" do |shell|
    shell.name = "Run \"grunt watch\""
    # The task needs to be daemonized for this to work:
    # 1. nohup: catch the HANGUP signal
    # 2. 0<&-: close file descriptor 0 (stdin)
    # 3. &>/home/vagrant/grunt-watch.log: Redirect stdout and stderr to /home/vagrant/grunt-watch.log
    # Refer http://stackoverflow.com/questions/19732652/vagrant-provision-not-able-to-start-grunt
    shell.inline = "nohup grunt --gruntfile /home/checkbook-web/Gruntfile.js watch 0<&- &>/home/vagrant/grunt-watch.log &"
    shell.privileged = false
  end

end
