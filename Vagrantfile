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

  # Every Vagrant virtual environment requires a box to build off of.
  config.vm.box = "ubuntu/trusty64"

  # Disable default share of current folder as /vagrant
  config.vm.synced_folder ".", "/vagrant", disabled: true

  # Share project folder as /home/checkbook-web
  config.vm.synced_folder ".", "/home/checkbook-web"

  # Make ports 8080 and 8443 of the vm available as ports 80 and 
  # 443 on the host
  # This will allow to access the server from the host browser
  config.vm.network "forwarded_port", guest: 8080, host: 80
  config.vm.network "forwarded_port", guest: 8443, host: 443

  # Install nodejs
  # Even though the server runs virtualized in a docker container, 
  # nodejs is still needed to run grunt, npm etc. in the 
  # development environment
  config.vm.provision "shell" do |shell|
    shell.name = "Install node.js"
    shell.inline = "curl -sL https://deb.nodesource.com/setup | bash - && apt-get install -y nodejs"
  end

  # Install the build-essential package (can't hurt) and the package
  # libfontconfig (dependency of the phantomjs headless browser used
  # for testing)
  config.vm.provision "shell" do |shell|
    shell.name = "Install vm os packages"
    shell.inline = "apt-get update && apt-get install -y build-essential libfontconfig git"
  end

  config.vm.provision "shell" do |shell|
    shell.name = "Install bower"
    shell.inline = "npm install -g bower grunt-cli"
  end

  config.vm.provision "shell" do |shell|
    shell.name = "Install dependencies"
    shell.inline = "cd /home/checkbook-web && npm install"
  end
end
