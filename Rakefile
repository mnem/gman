SOURCES = Dir.glob('coffee/*.coffee')
OUTPUT = 'main.js'
COMPILE_FRAGMENT = "-cj #{OUTPUT} #{SOURCES.join(" ")}"

def command_echoing_output(cmd)
    $stdout::puts cmd
    IO::popen(cmd) { |o| o.each { |output| $stdout::print output } }
end

desc "Deletes generated files"
task :clean do
    File.delete OUTPUT if File.exists? OUTPUT
end

desc "Generates builder JavaScript"
task :default do
    command_echoing_output "coffee #{COMPILE_FRAGMENT}"
end

desc "Watches the files and recompiles as necessary"
task :watch do
    command_echoing_output "coffee -w #{COMPILE_FRAGMENT}"
end
