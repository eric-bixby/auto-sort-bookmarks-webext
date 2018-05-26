#!/usr/bin/python

"""
genbookmarks.py

Haskell version:
http://codereview.stackexchange.com/questions/101621/netscape-bookmark-file-generator
Copyright (C) 2015  Boucher, Antoni <bouanto@zoho.com>

Haskell version ported to Python by Eric Bixby.
Copyright (C) 2016-2018  Eric Bixby <ebixby@yahoo.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
"""

import sys
import argparse
import random
import string

def generateFileContent(outputFile, dirCount, linkCount):
    f = open(outputFile, "w")
    f.write("<!DOCTYPE NETSCAPE-Bookmark-file-1>\n")
    f.write("<META HTTP-EQUIV=\"Content-Type\" CONTENT=\"text/html; charset=UTF-8\">\n")
    f.write("<TITLE>Bookmarks</TITLE>\n")
    f.write("<H1>Bookmarks Menu</H1>\n")
    f.write("\n")
    f.write("<DL><p>\n")
    f.write(generateBookmarks(dirCount, linkCount));
    f.write("</DL>\n")
    f.close()

def generateBookmarks(dirCount, linkCount):
    result = ""
    for d in range(0, dirCount):
        directoryName = generateName()
        result += "    <DT><H3 ADD_DATE=\"1438910135\" LAST_MODIFIED=\"1438910135\">" \
        + directoryName \
        + "</H3>\n" \
        + "    <DL><p>\n"
        for b in range(0, linkCount):
            bookmarkName = generateName()
            result += "        <DT><A HREF=\"https://" \
                + bookmarkName \
                + ".com/\">" \
                + bookmarkName \
                + "</a>\n"
        result += "    </DL><p>\n"
    return result

def generateName():
    return ''.join(random.choice(string.ascii_uppercase + string.ascii_lowercase + string.digits) for _ in range(10))

def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument("outputfile", help="output filename")
    parser.add_argument("--dircount", type=int, help="number of directories to generate", default=10)
    parser.add_argument("--linkcount", type=int, help="number of bookmarks to generate per directory", default=10)
    args = parser.parse_args()
    generateFileContent(args.outputfile, args.dircount, args.linkcount)

if __name__ == "__main__":
    main(sys.argv[1:])
