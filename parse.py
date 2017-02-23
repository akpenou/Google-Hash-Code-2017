import sys
import pandas as pd

def parse_endpoint(f):
	to_serve, nb_cache = [ int(x) for x in f.readline().strip().split(' ') ]
	caches = list()
	for index in range(nb_cache):
		_id, latence = [ int(x) for x in f.readline().strip().split(' ') ]
		caches.append((_id, latence))
	return ({'to_serve': to_serve, 'nb_cache': nb_cache, 'caches': caches})

def parse_req(f):
	info = dict()
	info['video_id'], info['endpoints'], info['nb_req'] = [ int(x) for x in f.readline().strip().split(' ') ]
	return info

def parse(filename):
	meta = dict()
	with open(filename) as f:
		meta['videos'], meta['endpoints'], meta['req_desc'], meta['caches'] , meta['size'] = [ int(x) for x in f.readline().strip().split(' ')]
		videos = [ int(x) for x in f.readline().strip().split(' ') ]
		endpoints = list()
		reqs = list()
		for index in range(meta['endpoints']):
			endpoints.append(parse_endpoint(f))
		for index in range(meta['req_desc']):
			reqs.append(parse_req(f))
	return meta, videos, endpoints, reqs

meta, videos, endpoints, reqs = parse('me_at_the_zoo.in')
df_reqs = pd.DataFrame(reqs)
