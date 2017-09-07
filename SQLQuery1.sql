create database dbVoiceRecords
use dbVoiceRecords

create table tblWords ( 
	id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
	word varchar(50),
);

create table tblRecords ( 
	id int IDENTITY(1,1) NOT NULL,
	word_id int FOREIGN KEY REFERENCES tblWords(id),
	url varchar(max),
	filename varchar(50),
	content_type varchar(50),
	blob_data varbinary(max),
	gender varchar(10) NULL,
	location varchar(20) NULL,
	age varchar(10) NULL
);

select * from tblWords
select * from tblRecords

SELECT TOP 1 * FROM tblRecords
ORDER BY NEWID()

DROP table tblWords
DROP table tblRecords

insert into tblWords values('hello')
insert into tblRecords values(1, 'urltofile', null, null, null)

Select COUNT(word) from tblWords where word = 'pig'

SELECT COUNT((Select * from tblWords where word = 'hello')) from tblWords





Select 0 from tblWords where word = 'hello'
